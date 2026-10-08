/* global process, console */
// Renders inspection keyframes for the LastSpin art quality gate.
// Usage: node scripts/last-spin/keyframes.mjs <outDir> [frame,frame,...] [scale]
// Set REMOTION_BROWSER to a Chrome/Chromium executable if needed.
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { mkdirSync } from "node:fs";
import path from "node:path";

const DEFAULT_FRAMES = {
  "01-opening-skirmish": 16,
  "02-first-encounter": 92,
  "03-mutual-spinning": 124,
  "04-heart-pin": 150,
  "05-fantasy-friendship": 262,
  "06-fantasy-childhood": 334,
  "07-fantasy-legends": 410,
  "08-betrayal-shot": 421,
  "09-super-button": 447,
  "10-super-blast": 465,
  "11-elimination": 486,
  "12-cube-collect": 556,
  "13-empty-battlefield": 680,
  "14-final-heart": 795,
};

const outDir = process.argv[2] ?? "out/last-spin-keyframes";
const frameArg = process.argv[3];
const scale = Number(process.argv[4] ?? 0.5);
const frames = frameArg
  ? Object.fromEntries(frameArg.split(",").map((f) => [`f${f.padStart(3, "0")}`, Number(f)]))
  : DEFAULT_FRAMES;

mkdirSync(outDir, { recursive: true });
const serveUrl = await bundle({
  entryPoint: path.resolve("src/remotion/LastSpin/dev/index.ts"),
  webpackOverride: (c) => c,
});
const browserExecutable = process.env.REMOTION_BROWSER ?? null;
const composition = await selectComposition({ serveUrl, id: "LastSpin", browserExecutable });
for (const [name, frame] of Object.entries(frames)) {
  const output = path.join(outDir, `${name}.jpg`);
  await renderStill({
    serveUrl,
    composition,
    frame,
    output,
    imageFormat: "jpeg",
    jpegQuality: 85,
    scale,
    browserExecutable,
  });
  console.log("rendered", output);
}
