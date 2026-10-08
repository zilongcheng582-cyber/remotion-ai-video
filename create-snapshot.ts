import { put } from "@vercel/blob";
import { addBundleToSandbox, createSandbox } from "@remotion/vercel";
import { bundleRemotionProject } from "./src/app/api/render/helpers";

const getSnapshotBlobKey = () =>
  `snapshot-cache/${process.env.VERCEL_DEPLOYMENT_ID ?? "local"}.json`;

const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
if (!blobToken) {
  throw new Error(
    "[create-snapshot] BLOB_READ_WRITE_TOKEN is not set for this build environment (Production vs Preview). Link the Blob store to this project for the environment being built, then redeploy.",
  );
}

const snapshotBlobKey = getSnapshotBlobKey();
// A store ID is not a secret (it is part of every public blob URL). Log it so the
// token can be matched to the store shown in the Vercel dashboard.
const [tokenPrefix = "", , , tokenStoreId = ""] = blobToken.split("_");
console.log(
  `[create-snapshot] Blob token present (format ${tokenPrefix || "unknown"}, store ID: ${tokenStoreId || "unparseable"}). Target key: ${snapshotBlobKey} (VERCEL_DEPLOYMENT_ID ${process.env.VERCEL_DEPLOYMENT_ID ? "set" : "unset, using local"})`,
);

const redact = (value: string) => value.split(blobToken).join("[redacted]");

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
    token: blobToken,
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
  console.error(`[create-snapshot]   key: ${snapshotBlobKey}, access: public`);
  throw err;
}

console.log(`[create-snapshot] Snapshot saved: ${snapshotId} (never expires)`);
