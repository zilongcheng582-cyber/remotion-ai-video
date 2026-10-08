import {
  addBundleToSandbox,
  createSandbox,
  renderMediaOnVercel,
} from "@remotion/vercel";
import { put } from "@vercel/blob";
import { waitUntil } from "@vercel/functions";
import { randomUUID } from "node:crypto";
import { resolveBlobAuth } from "./blob-auth";
import { RenderRequest } from "../../../../types/schema";
import {
  bundleRemotionProject,
  formatSSE,
  type RenderProgress,
} from "./helpers";
import { restoreSnapshot } from "./restore-snapshot";

export async function POST(req: Request) {
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Throws a clear error if neither OIDC (BLOB_STORE_ID) nor a legacy token is configured.
  const blobAuth = resolveBlobAuth();

  const payload = await req.json();
  const body = RenderRequest.parse(payload);

  const send = async (message: RenderProgress) => {
    await writer.write(encoder.encode(formatSSE(message)));
  };

  const runRender = async () => {
    await send({ type: "phase", phase: "Creating sandbox...", progress: 0 });
    const sandbox = process.env.VERCEL
      ? await restoreSnapshot()
      : await createSandbox({
          onProgress: async ({ progress, message }) => {
            await send({
              type: "phase",
              phase: message,
              progress,
              subtitle: "This is only needed during development.",
            });
          },
        });

    try {
      if (!process.env.VERCEL) {
        bundleRemotionProject(".remotion");
        await addBundleToSandbox({ sandbox, bundleDir: ".remotion" });
      }

      const { sandboxFilePath, contentType } = await renderMediaOnVercel({
        sandbox,
        compositionId: body.id,
        inputProps: body.inputProps,
        onProgress: async (update) => {
          switch (update.stage) {
            case "opening-browser":
              await send({
                type: "phase",
                phase: "Opening browser...",
                progress: update.overallProgress,
              });
              break;
            case "selecting-composition":
              await send({
                type: "phase",
                phase: "Selecting composition...",
                progress: update.overallProgress,
              });
              break;
            case "render-progress":
              await send({
                type: "phase",
                phase: "Rendering video...",
                progress: update.overallProgress,
              });
              break;
            default:
              break;
          }
        },
      });

      await send({
        type: "phase",
        phase: "Uploading video...",
        progress: 1,
      });

      // @remotion/vercel's uploadToVercelBlob() uploads from inside the sandbox and
      // requires a legacy BLOB_READ_WRITE_TOKEN. To support OIDC, read the MP4 out of
      // the sandbox and upload it with the official SDK from this server function.
      const video = await sandbox.readFileToBuffer({ path: sandboxFilePath });
      if (!video) {
        throw new Error(
          `Rendered file not found in sandbox: ${sandboxFilePath}`,
        );
      }

      const { downloadUrl: url } = await put(
        `renders/${randomUUID()}.mp4`,
        video,
        {
          access: "public",
          contentType,
          ...blobAuth.options,
        },
      );
      const size = video.byteLength;

      await send({ type: "done", url, size });
    } catch (err) {
      console.log(err);
      await send({ type: "error", message: (err as Error).message });
    } finally {
      await sandbox?.stop().catch(() => {});
      await writer.close();
    }
  };

  waitUntil(runRender());

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
