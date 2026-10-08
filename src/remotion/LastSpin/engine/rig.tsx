import React from "react";
import { GROUND_T, HEIGHT_V, shade } from "./math";

// A tiny 2.5D rig. Body parts live in character-local 3D space:
//   x = character's right, y = forward (facing direction), z = up.
// The facing angle `phi` (degrees) is 0 when the character faces the camera,
// 90 when facing screen-right, 180 facing away, -90 facing screen-left.
// Parts are projected with the same three-quarter camera as the arena and
// painter-sorted by depth, so a character can rotate continuously (spinning!).

export type V3 = [number, number, number];

export type View = {
  phi: number;
  t: number; // ground depth compression
  v: number; // height scale
  cam: [number, number]; // direction toward the camera: (depth, up)
  silhouette?: string;
  uid: string; // unique per rendered instance (clip-path ids)
};

export const makeView = (
  uid: string,
  phi: number,
  t = GROUND_T,
  v = HEIGHT_V,
  silhouette?: string,
): View => {
  const th = Math.asin(Math.min(0.99, t));
  return { uid, phi, t, v, cam: [Math.cos(th), Math.sin(th)], silhouette };
};

const rad = (d: number) => (d * Math.PI) / 180;

/** Local -> world (wx: screen right, wd: toward camera, z: up). */
export const toWorld = (p: V3, phi: number): V3 => {
  const c = Math.cos(rad(phi));
  const s = Math.sin(rad(phi));
  return [-p[0] * c + p[1] * s, p[0] * s + p[1] * c, p[2]];
};

export type Pt = { x: number; y: number; d: number };

export const project = (view: View, p: V3): Pt => {
  const [wx, wd, z] = toWorld(p, view.phi);
  return { x: wx, y: wd * view.t - z * view.v, d: wd };
};

/** How much a surface with local azimuth `a` faces the camera (-1..1). */
export const facing = (view: View, a: number, elev = 0) => {
  const horiz = Math.cos(rad(a - view.phi)) * Math.cos(rad(elev));
  return horiz * view.cam[0] + Math.sin(rad(elev)) * view.cam[1];
};

export const halfWidth = (W: number, D: number, phi: number) =>
  Math.sqrt((W * Math.cos(rad(phi))) ** 2 + (D * Math.sin(rad(phi))) ** 2);

const depthExtent = (W: number, D: number, phi: number) =>
  Math.sqrt((W * Math.sin(rad(phi))) ** 2 + (D * Math.cos(rad(phi))) ** 2);

export type Part = { d: number; el: React.ReactNode };

const OUTLINE = "#2b1608";

export const fill = (view: View, color: string) => view.silhouette ?? color;
export const line = (view: View, color: string) =>
  view.silhouette ? view.silhouette : shade(color, -0.55);

// --- Primitive builders -----------------------------------------------------

export const limb = (
  view: View,
  key: string,
  a: V3,
  b: V3,
  width: number,
  color: string,
  depthBias = 0,
): Part => {
  const pa = project(view, a);
  const pb = project(view, b);
  return {
    d: (pa.d + pb.d) / 2 + depthBias,
    el: (
      <g key={key}>
        <line
          x1={pa.x}
          y1={pa.y}
          x2={pb.x}
          y2={pb.y}
          stroke={view.silhouette ?? OUTLINE}
          strokeWidth={width + 5}
          strokeLinecap="round"
        />
        <line
          x1={pa.x}
          y1={pa.y}
          x2={pb.x}
          y2={pb.y}
          stroke={fill(view, color)}
          strokeWidth={width}
          strokeLinecap="round"
        />
        {view.silhouette ? null : (
          <line
            x1={pa.x - width * 0.18}
            y1={pa.y - width * 0.12}
            x2={pb.x - width * 0.18}
            y2={pb.y - width * 0.12}
            stroke={shade(color, 0.28)}
            strokeWidth={width * 0.32}
            strokeLinecap="round"
            opacity={0.7}
          />
        )}
      </g>
    ),
  };
};

export const ball = (
  view: View,
  key: string,
  c: V3,
  r: number,
  color: string,
  depthBias = 0,
  children?: React.ReactNode,
): Part => {
  const p = project(view, c);
  return {
    d: p.d + depthBias,
    el: (
      <g key={key}>
        <circle
          cx={p.x}
          cy={p.y}
          r={r + 2.5}
          fill={view.silhouette ?? OUTLINE}
        />
        <circle cx={p.x} cy={p.y} r={r} fill={fill(view, color)} />
        {view.silhouette ? null : (
          <>
            <circle
              cx={p.x + r * 0.18}
              cy={p.y + r * 0.22}
              r={r * 0.82}
              fill={shade(color, -0.18)}
              opacity={0.55}
            />
            <circle
              cx={p.x - r * 0.12}
              cy={p.y - r * 0.12}
              r={r * 0.78}
              fill={color}
            />
            <ellipse
              cx={p.x - r * 0.38}
              cy={p.y - r * 0.42}
              rx={r * 0.28}
              ry={r * 0.18}
              fill="#fff"
              opacity={0.45}
            />
          </>
        )}
        {children}
      </g>
    ),
  };
};

/**
 * A tapered body segment with elliptical cross sections (torso, trunks...).
 * Returns the outline path so callers can reuse it as a clip.
 */
export const segmentPath = (
  view: View,
  zb: number,
  zt: number,
  wb: number,
  db: number,
  wt: number,
  dt: number,
  bulge = 1.08,
) => {
  const hb = halfWidth(wb, db, view.phi);
  const ht = halfWidth(wt, dt, view.phi);
  const rb = depthExtent(wb, db, view.phi) * view.t;
  const rt = depthExtent(wt, dt, view.phi) * view.t;
  const yb = -zb * view.v;
  const yt = -zt * view.v;
  const ym = (yb + yt) / 2;
  const hm = Math.max(hb, ht) * bulge;
  return (
    `M ${-ht} ${yt} A ${ht} ${rt} 0 0 1 ${ht} ${yt} ` +
    `Q ${hm} ${ym} ${hb} ${yb} A ${hb} ${rb} 0 0 1 ${-hb} ${yb} ` +
    `Q ${-hm} ${ym} ${-ht} ${yt} Z`
  );
};

export const segment = (
  view: View,
  key: string,
  zb: number,
  zt: number,
  wb: number,
  db: number,
  wt: number,
  dt: number,
  color: string,
  depth = 0,
  children?: React.ReactNode,
  bulge?: number,
): Part => {
  const d = segmentPath(view, zb, zt, wb, db, wt, dt, bulge);
  const hb = halfWidth(wb, db, view.phi);
  const ht = halfWidth(wt, dt, view.phi);
  const yb = -zb * view.v;
  const yt = -zt * view.v;
  const clipId = `clip-${view.uid}-${key}`;
  return {
    d: depth,
    el: (
      <g key={key}>
        <path
          d={d}
          fill={fill(view, color)}
          stroke={view.silhouette ?? OUTLINE}
          strokeWidth={3}
          strokeLinejoin="round"
        />
        {view.silhouette ? null : (
          <>
            <clipPath id={clipId}>
              <path d={d} />
            </clipPath>
            <g clipPath={`url(#${clipId})`}>
              {children}
              {/* soft cylindrical shading: light from upper left */}
              <rect
                x={Math.max(hb, ht) * 0.25}
                y={yt - 40}
                width={Math.max(hb, ht)}
                height={yb - yt + 80}
                fill={shade(color, -0.3)}
                opacity={0.45}
              />
              <rect
                x={-Math.max(hb, ht) * 0.75}
                y={yt - 40}
                width={Math.max(hb, ht) * 0.32}
                height={yb - yt + 80}
                fill={shade(color, 0.3)}
                opacity={0.35}
              />
            </g>
          </>
        )}
      </g>
    ),
  };
};

/** A horizontal band (belt, trunks...) painted onto a body segment. */
export const band = (
  view: View,
  key: string,
  z0: number,
  z1: number,
  W: number,
  D: number,
  color: string,
) => {
  const w = W * 1.25;
  const dd = D * 1.25;
  const h = halfWidth(w, dd, view.phi);
  const r = depthExtent(w, dd, view.phi) * view.t;
  const y0 = -z0 * view.v;
  const y1 = -z1 * view.v;
  return (
    <path
      key={key}
      d={`M ${-h} ${y1} A ${h} ${r} 0 0 0 ${h} ${y1} L ${h} ${y0} A ${h} ${r} 0 0 1 ${-h} ${y0} Z`}
      fill={color}
      stroke={shade(color, -0.45)}
      strokeWidth={2}
    />
  );
};

/** Point on an elliptical body cross-section at azimuth `a` and height z. */
export const surf = (a: number, z: number, W: number, D: number): V3 => [
  W * Math.sin(rad(a)),
  D * Math.cos(rad(a)),
  z,
];

/** Point on a sphere (azimuth a, elevation e) around center c. */
export const sph = (c: V3, r: number, a: number, e: number): V3 => [
  c[0] + r * Math.cos(rad(e)) * Math.sin(rad(a)),
  c[1] + r * Math.cos(rad(e)) * Math.cos(rad(a)),
  c[2] + r * Math.sin(rad(e)),
];

/** Elbow position for a two-bone arm, pushed outward and down. */
export const elbow = (s: V3, h: V3, side: 1 | -1, out = 10, down = 8): V3 => [
  (s[0] + h[0]) / 2 + side * out,
  (s[1] + h[1]) / 2 - 4,
  (s[2] + h[2]) / 2 - down,
];

export const mixV = (a: V3, b: V3, t: number): V3 => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

export const addV = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

export const renderParts = (parts: Part[]) =>
  parts
    .map((p, i) => ({ ...p, i }))
    .sort((a, b) => a.d - b.d || a.i - b.i)
    .map((p) => p.el);

/** Ground contact shadow. */
export const Shadow: React.FC<{ r: number; t?: number; opacity?: number }> = ({
  r,
  t = GROUND_T,
  opacity = 0.32,
}) => (
  <ellipse cx={0} cy={0} rx={r} ry={r * t} fill="#3a1f0a" opacity={opacity} />
);
