import React from "react";
import { CHAR_T, CHAR_V, clamp01, GROUND_T, HEIGHT_V, rand } from "../engine/math";
import { toWorld, V3 } from "../engine/rig";
import { PowerCubeIcon, WALL } from "../world/Props";

const T = GROUND_T;

/** Screen (map-space) position of a point attached to a character rig. */
export const rigPoint = (x: number, y: number, phi: number, local: V3): [number, number] => {
  const [wx, wd, z] = toWorld(local, phi);
  return [x + wx, y * T + wd * CHAR_T - z * CHAR_V];
};

export const shellyMuzzle = (x: number, y: number, phi: number) => rigPoint(x, y, phi, [-7, 56, 66]);

// --- Bandit bullets ------------------------------------------------------------
export const Bullet: React.FC<{ from: [number, number]; to: [number, number]; start: number; dur: number; frame: number }> = ({
  from,
  to,
  start,
  dur,
  frame,
}) => {
  const t = (frame - start) / dur;
  if (t < 0 || t > 1) return null;
  const x = from[0] + (to[0] - from[0]) * t;
  const y = from[1] + (to[1] - from[1]) * t;
  const ang = (Math.atan2(to[1] - from[1], to[0] - from[0]) * 180) / Math.PI;
  return (
    <g transform={`translate(${x} ${y}) rotate(${ang})`}>
      <rect x={-34} y={-4} width={34} height={8} rx={4} fill="#ffd36a" opacity={0.45} />
      <ellipse cx={0} cy={0} rx={11} ry={6} fill="#ffb02a" stroke="#6a2a00" strokeWidth={2} />
      <ellipse cx={2} cy={-1.5} rx={4} ry={2} fill="#fff6c8" />
    </g>
  );
};

export const ImpactSpark: React.FC<{ x: number; y: number; start: number; frame: number; color?: string; size?: number }> = ({
  x,
  y,
  start,
  frame,
  color = "#ffe08a",
  size = 1,
}) => {
  const t = frame - start;
  if (t < 0 || t > 8) return null;
  const k = t / 8;
  return (
    <g transform={`translate(${x} ${y}) scale(${size})`} opacity={1 - k}>
      <circle r={10 + k * 26} fill="none" stroke={color} strokeWidth={6 * (1 - k)} />
      {Array.from({ length: 7 }).map((_, i) => {
        const a = (i / 7) * Math.PI * 2 + start;
        const r0 = 8 + k * 16;
        const r1 = 18 + k * 34;
        return (
          <line
            key={i}
            x1={Math.cos(a) * r0}
            y1={Math.sin(a) * r0}
            x2={Math.cos(a) * r1}
            y2={Math.sin(a) * r1}
            stroke="#fff"
            strokeWidth={4 * (1 - k)}
            strokeLinecap="round"
          />
        );
      })}
    </g>
  );
};

// --- Shotgun ------------------------------------------------------------------
export const MuzzleFlash: React.FC<{ x: number; y: number; angle: number; start: number; frame: number; big?: boolean }> = ({
  x,
  y,
  angle,
  start,
  frame,
  big,
}) => {
  const t = frame - start;
  const len = big ? 7 : 4;
  if (t < 0 || t >= len) return null;
  const s = (big ? 2.1 : 1.15) * (1 - t / len) + 0.3;
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${s})`}>
      <circle r={30} fill="#fff3a0" opacity={0.55} />
      <path d="M 0 -18 L 58 -5 L 86 0 L 58 5 L 0 18 L 18 0 Z" fill="#ffb21f" stroke="#ff6a00" strokeWidth={3} strokeLinejoin="round" />
      <path d="M 0 -26 L 40 -22 L 10 -6 Z M 0 26 L 40 22 L 10 6 Z" fill="#ffcf4a" />
      <circle r={14} fill="#ffffff" />
    </g>
  );
};

/**
 * Shotgun pellet cone in map space. `angle` is the screen-space direction.
 * Pellets fly `range` px; `hitAt` frames after start they connect.
 */
export const PelletCone: React.FC<{
  x: number;
  y: number;
  angle: number;
  count: number;
  spread: number;
  range: number;
  start: number;
  dur: number;
  frame: number;
  big?: boolean;
}> = ({ x, y, angle, count, spread, range, start, dur, frame, big }) => {
  const t = (frame - start) / dur;
  if (t < 0 || t > 1.15) return null;
  const k = clamp01(t);
  const fade = t > 1 ? 1 - (t - 1) / 0.15 : 1;
  return (
    <g opacity={fade}>
      {big ? (
        <path
          d={coneShape(x, y, angle, spread * 1.1, range * k)}
          fill="#ffe14a"
          opacity={0.18 * (1 - k * 0.5)}
        />
      ) : null}
      {Array.from({ length: count }).map((_, i) => {
        const a = ((angle + (i / (count - 1) - 0.5) * 2 * spread + (rand(i + start) - 0.5) * 3) * Math.PI) / 180;
        const d = range * k * (0.92 + rand(i * 3 + start) * 0.08);
        const px = x + Math.cos(a) * d;
        const py = y + Math.sin(a) * d;
        const tail = Math.min(d, big ? 70 : 46);
        return (
          <g key={i}>
            <line
              x1={px - Math.cos(a) * tail}
              y1={py - Math.sin(a) * tail}
              x2={px}
              y2={py}
              stroke={big ? "#ffe14a" : "#ffcf7a"}
              strokeWidth={big ? 9 : 6}
              strokeLinecap="round"
              opacity={0.75}
            />
            <circle cx={px} cy={py} r={big ? 9 : 7} fill="#3a2a22" stroke="#ffef9a" strokeWidth={big ? 3.5 : 2.5} />
          </g>
        );
      })}
    </g>
  );
};

const coneShape = (x: number, y: number, angle: number, spread: number, r: number) => {
  const a0 = ((angle - spread) * Math.PI) / 180;
  const a1 = ((angle + spread) * Math.PI) / 180;
  return `M ${x} ${y} L ${x + Math.cos(a0) * r} ${y + Math.sin(a0) * r} A ${r} ${r} 0 0 1 ${x + Math.cos(a1) * r} ${y + Math.sin(a1) * r} Z`;
};

/** Super aim indicator on the ground (world coordinates, projected). */
export const AimCone: React.FC<{ x: number; y: number; dirDeg: number; opacity: number; range?: number }> = ({
  x,
  y,
  dirDeg,
  opacity,
  range = 330,
}) => {
  if (opacity <= 0) return null;
  const spread = 24;
  const pts: string[] = [];
  const N = 16;
  for (let i = 0; i <= N; i++) {
    const a = ((dirDeg - spread + (2 * spread * i) / N) * Math.PI) / 180;
    pts.push(`${x + Math.sin(a) * range} ${(y + Math.cos(a) * range) * T}`);
  }
  const d = `M ${x} ${y * T} L ${pts.join(" L ")} Z`;
  return (
    <g opacity={opacity}>
      <path d={d} fill="#ffd21f" opacity={0.32} />
      <path d={d} fill="none" stroke="#fff3a0" strokeWidth={5} strokeLinejoin="round" opacity={0.9} />
    </g>
  );
};

// --- Destruction ----------------------------------------------------------------
export const WallDebris: React.FC<{ col: number; rows: number[]; start: number; frame: number; dirX: number }> = ({
  col,
  rows,
  start,
  frame,
  dirX,
}) => {
  const t = frame - start;
  if (t < 0) return null;
  const pieces = rows.flatMap((row) =>
    Array.from({ length: 14 }).map((_, i) => ({ row, i, seed: row * 50 + i })),
  );
  return (
    <g>
      {/* rubble left on the ground */}
      {rows.map((row) =>
        Array.from({ length: 6 }).map((_, i) => {
          const r = rand(row * 9 + i);
          return (
            <ellipse
              key={`r${row}-${i}`}
              cx={col * 100 + 12 + r * 76}
              cy={(row * 100 + 20 + rand(row * 3 + i * 7) * 70) * T}
              rx={9 + r * 8}
              ry={6 + r * 4}
              fill={i % 2 ? WALL.front : WALL.top}
              stroke={WALL.line}
              strokeWidth={2}
              opacity={clamp01(t / 6)}
            />
          );
        }),
      )}
      {t < 40
        ? pieces.map(({ row, i, seed }) => {
            const vx = (dirX * (2 + rand(seed) * 9) + (rand(seed * 2) - 0.5) * 5) * 1.1;
            const vy = -(7 + rand(seed * 3) * 10);
            const g = 0.9;
            const x = col * 100 + 50 + (rand(seed * 5) - 0.5) * 80 + vx * t;
            const ground = (row * 100 + 50) * T;
            const h = Math.max(0, -(vy * t + 0.5 * g * t * t) + 40);
            const y = ground - h + (rand(seed * 7) - 0.5) * 40;
            const s = 6 + rand(seed * 11) * 10;
            const op = t < 28 ? 1 : 1 - (t - 28) / 12;
            return (
              <rect
                key={`p${seed}`}
                x={x - s / 2}
                y={y - s / 2}
                width={s}
                height={s * 0.8}
                rx={2}
                fill={i % 3 === 0 ? WALL.top : WALL.front}
                stroke={WALL.line}
                strokeWidth={2}
                opacity={op}
                transform={`rotate(${t * (rand(seed) * 30 - 15)} ${x} ${y})`}
              />
            );
          })
        : null}
      {/* dust cloud */}
      {t < 46
        ? Array.from({ length: 9 }).map((_, i) => {
            const k = t / 46;
            const r = 30 + k * 70 + rand(i) * 20;
            return (
              <circle
                key={`d${i}`}
                cx={col * 100 + 50 + (rand(i * 4) - 0.5) * 120 + dirX * k * 60}
                cy={(rows[0] * 100 + 100) * T - 30 - rand(i * 6) * 50 - k * 30}
                r={r}
                fill="#e8c79a"
                opacity={0.55 * (1 - k)}
              />
            );
          })
        : null}
    </g>
  );
};

/** Defeat effect: a soft dust puff and drifting sparks where a brawler vanishes. */
export const DefeatPoof: React.FC<{ x: number; y: number; start: number; frame: number }> = ({ x, y, start, frame }) => {
  const t = frame - start;
  if (t < 0 || t > 44) return null;
  const k = t / 44;
  return (
    <g transform={`translate(${x} ${y * T})`}>
      {Array.from({ length: 14 }).map((_, i) => {
        const a = (i / 14) * Math.PI * 2 + rand(i) * 0.5;
        const r = 18 + k * (50 + rand(i * 3) * 40);
        return (
          <circle
            key={i}
            cx={Math.cos(a) * r}
            cy={Math.sin(a) * r * 0.55 - 30 - k * 30}
            r={(22 + rand(i * 7) * 14) * (1 - k * 0.5)}
            fill={i % 3 === 0 ? "#e9d6c2" : "#d8c0a8"}
            opacity={0.55 * (1 - k)}
          />
        );
      })}
      {Array.from({ length: 10 }).map((_, i) => (
        <circle
          key={`s${i}`}
          cx={(rand(i * 3) - 0.5) * 90 + Math.sin(t / 5 + i) * 6}
          cy={-50 - k * (90 + rand(i) * 90)}
          r={3.5 * (1 - k)}
          fill="#bfe6ff"
          opacity={1 - k}
        />
      ))}
    </g>
  );
};

/** Dropped power cube: pops out, bounces, then hovers with a soft glow. */
export const DroppedCube: React.FC<{
  x: number;
  y: number;
  start: number;
  frame: number;
  collectAt: number;
  collector: [number, number];
}> = ({ x, y, start, frame, collectAt, collector }) => {
  const t = frame - start;
  if (t < 0) return null;
  const c = clamp01((frame - collectAt) / 7);
  if (c >= 1) return null;
  const bounce = t < 18 ? Math.abs(Math.sin((t / 18) * Math.PI * 2)) * (1 - t / 18) * 60 : 0;
  const hover = 22 + Math.sin(frame / 8) * 5;
  const px = x + (collector[0] - x) * c;
  const pyWorld = y + (collector[1] - y) * c;
  const z = (t < 18 ? bounce + 22 * (t / 18) : hover) + c * 60;
  const s = 1.25 * (1 - c * 0.7) * Math.min(1, t / 4);
  return (
    <g>
      <ellipse cx={px} cy={pyWorld * T} rx={24} ry={10} fill="#1d5e12" opacity={0.3 * (1 - c)} />
      <ellipse cx={px} cy={pyWorld * T} rx={34 + Math.sin(frame / 6) * 4} ry={14} fill="#7dff6a" opacity={0.18 * (1 - c)} />
      <PowerCubeIcon x={px} y={pyWorld * T - z * HEIGHT_V} s={s} glow={1} />
    </g>
  );
};

/** Circular scuff marks left in the sand by spinning. */
export const SpinMarks: React.FC<{ x: number; y: number; amount: number; glow?: number }> = ({ x, y, amount, glow = 0 }) => {
  if (amount <= 0) return null;
  return (
    <g transform={`translate(${x} ${y * T})`}>
      <ellipse rx={40} ry={40 * T} fill="none" stroke="#c78f4c" strokeWidth={7} opacity={0.45 * amount} strokeDasharray="22 10" />
      <ellipse rx={26} ry={26 * T} fill="none" stroke="#d29a55" strokeWidth={4} opacity={0.35 * amount} />
      {glow > 0 ? (
        <ellipse rx={44} ry={44 * T} fill="none" stroke="#ffd59a" strokeWidth={5} opacity={0.6 * glow} />
      ) : null}
    </g>
  );
};
