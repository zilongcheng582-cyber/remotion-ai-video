import { put } from "@vercel/blob";
import { addBundleToSandbox, createSandbox } from "@remotion/vercel";
import { resolveBlobAuth } from "./src/app/api/render/blob-auth";
import { bundleRemotionProject } from "./src/app/api/render/helpers";

const getSnapshotBlobKey = () =>
  `snapshot-cache/${process.env.VERCEL_DEPLOYMENT_ID ?? "local"}.json`;

const blobAuth = resolveBlobAuth();
const snapshotBlobKey = getSnapshotBlobKey();
console.log(
  `[create-snapshot] Blob auth: ${blobAuth.method}${
    "storeId" in blobAuth.options
      ? ` (BLOB_STORE_ID: ${blobAuth.options.storeId}, VERCEL_OIDC_TOKEN ${process.env.VERCEL_OIDC_TOKEN ? "present" : "MISSING"})`
      : ""
  }. Target key: ${snapshotBlobKey} (VERCEL_DEPLOYMENT_ID ${process.env.VERCEL_DEPLOYMENT_ID ? "set" : "unset, using local"})`,
);

const redact = (value: string) =>
  [process.env.BLOB_READ_WRITE_TOKEN, process.env.VERCEL_OIDC_TOKEN]
    .filter((secret): secret is string => Boolean(secret))
    .reduce((text, secret) => text.split(secret).join("[redacted]"), value);

const sandbox = await createSandbox({
  onProgress: ({ progress, message }) => {
    const pct = Math.round(progress * 100);
    console.log(`[create-snapshot] ${message} (${pct}%)`);
  },
});

console.log("[create-snapshot] Adding Remotion bundle...");
bundleRemotionProject(".remotion");
await addBundleToSandbox({ sandbox, bundleDir: ".remotion" });

console.log("[create-snapshot] Taking snapshot...");
const snapshot = await sandbox.snapshot({ expiration: 0 });
const { snapshotId } = snapshot;

try {
  const result = await put(snapshotBlobKey, JSON.stringify({ snapshotId }), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    // The key is unique per deployment, so overwriting only affects a retried
    // build of the same deployment; without it a retry fails with "blob already exists".
    allowOverwrite: true,
    ...blobAuth.options,
  });
  console.log(`[create-snapshot] Snapshot pointer uploaded: ${result.url}`);
} catch (err) {
  const e = err as Error & {
    code?: unknown;
    status?: unknown;
    statusCode?: unknown;
    cause?: unknown;
  };
  console.error("[create-snapshot] BLOB PUT FAILED");
  console.error(`[create-snapshot]   name: ${e.name}`);
  console.error(`[create-snapshot]   message: ${redact(String(e.message))}`);
  console.error(`[create-snapshot]   code: ${String(e.code ?? "n/a")}`);
  console.error(
    `[create-snapshot]   status: ${String(e.status ?? e.statusCode ?? "n/a")}`,
  );
  if (e.cause) {
    console.error(`[create-snapshot]   cause: ${redact(String(e.cause))}`);
  }
  console.error(
    `[create-snapshot]   key: ${snapshotBlobKey}, access: public, auth: ${blobAuth.method}`,
  );
  throw err;
}

console.log(`[create-snapshot] Snapshot saved: ${snapshotId} (never expires)`);
