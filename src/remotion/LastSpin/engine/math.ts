import { Easing, interpolate } from "remotion";

// --- Projection -------------------------------------------------------------
// The arena uses a fixed three-quarter top-down camera: ground depth (world y)
// is compressed by GROUND_T and vertical height is drawn at HEIGHT_V.
export const GROUND_T = 0.72;
export const HEIGHT_V = 0.84;

// Characters are drawn with a gentler internal tilt so faces stay readable
// (the same billboard compromise top-down games make).
export const CHAR_T = 0.46;
export const CHAR_V = 0.9;

export const projY = (y: number, z = 0, t = GROUND_T, v = HEIGHT_V) =>
  y * t - z * v;

// --- Keyframe tracks --------------------------------------------------------
export type Key<T> = [number, T];

const clampOpts = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

export const ease = Easing.bezier(0.45, 0, 0.55, 1);
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
export const easeIn = Easing.bezier(0.7, 0, 0.84, 0);

/** Piecewise interpolation through numeric keyframes with ease-in-out. */
export const track = (
  frame: number,
  keys: Key<number>[],
  easing: (t: number) => number = ease,
): number => {
  if (frame <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [f0, v0] = keys[i];
    const [f1, v1] = keys[i + 1];
    if (frame <= f1) {
      return interpolate(frame, [f0, f1], [v0, v1], { ...clampOpts, easing });
    }
  }
  return keys[keys.length - 1][1];
};

export const track2 = (
  frame: number,
  keys: Key<[number, number]>[],
  easing: (t: number) => number = ease,
): [number, number] => [
  track(
    frame,
    keys.map(([f, v]) => [f, v[0]]),
    easing,
  ),
  track(
    frame,
    keys.map(([f, v]) => [f, v[1]]),
    easing,
  ),
];

/** Clamped interpolate shorthand. */
export const lerp = (
  frame: number,
  input: [number, number],
  output: [number, number],
  easing?: (t: number) => number,
) => interpolate(frame, input, output, { ...clampOpts, easing });

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Deterministic pseudo-random number in [0,1) for a seed. */
export const rand = (seed: number) => {
  const s = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
};

/** Facing angle (degrees) to look from (x0,y0) toward (x1,y1). */
export const faceToward = (x0: number, y0: number, x1: number, y1: number) =>
  (Math.atan2(x1 - x0, y1 - y0) * 180) / Math.PI;

/** Damped spring-like pop: 0 -> overshoot -> 1 over `dur` frames. */
export const pop = (frame: number, start: number, dur = 10) => {
  const t = clamp01((frame - start) / dur);
  if (t <= 0) return 0;
  return 1 + Math.sin(t * Math.PI * 1.5) * 0.25 * (1 - t) ** 1.2 - (1 - t) ** 3;
};

// Shade helpers for hex colors.
export const shade = (hex: string, amt: number) => {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const f = (c: number) =>
    Math.round(
      Math.max(0, Math.min(255, amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)),
    );
  return `#${((1 << 24) | (f(r) << 16) | (f(g) << 8) | f(b)).toString(16).slice(1)}`;
};
