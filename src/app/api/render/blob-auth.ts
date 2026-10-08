/**
 * Vercel Blob authentication, shared by create-snapshot.ts and the render API.
 *
 * Modern projects authenticate with Vercel OIDC: the platform injects short-lived
 * credentials and the Blob store is selected with BLOB_STORE_ID. Legacy projects
 * use a long-lived BLOB_READ_WRITE_TOKEN. @vercel/blob resolves the credentials
 * itself; this helper only decides which options to pass and fails with a clear
 * message when neither is configured. It never returns or logs a secret.
 */
export type BlobAuth = {
  method: "oidc" | "read-write-token";
  /** Options to spread into put()/get(). Contains no OIDC token. */
  options: { storeId: string } | { token: string };
};

export function resolveBlobAuth(): BlobAuth {
  const storeId = process.env.BLOB_STORE_ID?.trim();
  if (storeId) {
    return { method: "oidc", options: { storeId } };
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (token) {
    return { method: "read-write-token", options: { token } };
  }

  throw new Error(
    "No Vercel Blob credentials configured. Connect a Blob store to this project (this sets BLOB_STORE_ID and uses Vercel OIDC), or set BLOB_READ_WRITE_TOKEN for legacy token auth. The variable must be enabled for the environment being built or run (Production/Preview/Development).",
  );
}
