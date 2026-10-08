import React from "react";
import { GROUND_T, HEIGHT_V, rand } from "../engine/math";
import { TILE } from "./map";

// Static arena props, drawn in projected map space (x, y*T - z*V).

const T = GROUND_T;
const V = HEIGHT_V;

export const WALL_H = 74;
// Colors sampled from the Solo Showdown reference (image E).
export const WALL = { top: "#e57a5c", topLight: "#f08e6e", topDark: "#d26a4e", front: "#c45a3e", frontDark: "#a8452e", line: "#8a3622" };

export const WallRun: React.FC<{ x0: number; x1: number; y0: number; seed: number }> = ({ x0, x1, y0, seed }) => {
  const yTop = y0 * T - WALL_H * V;
  const yTopB = (y0 + TILE) * T - WALL_H * V;
  const yBot = (y0 + TILE) * T;
  const w = x1 - x0;
  // jagged rocky lower edge of the front face
  const jag: string[] = [];
  const steps = Math.max(4, Math.round(w / 14));
  for (let i = 0; i <= steps; i++) {
    const x = x0 + (w * i) / steps;
    const d = rand(seed * 13 + i) * 9;
    jag.push(`L ${x} ${yBot - d}`);
  }
  const strata: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = x0 + (w * i) / steps;
    strata.push(`${i === 0 ? "M" : "L"} ${x} ${yTopB + 20 + rand(seed * 5 + i) * 6}`);
  }
  return (
    <g>
      <path d={`M ${x0} ${yTopB - 4} L ${x1} ${yTopB - 4} L ${x1} ${yBot - 4} ${jag.reverse().join(" ")} L ${x0} ${yBot - 4} Z`} fill={WALL.front} />
      <path d={strata.join(" ")} stroke={WALL.frontDark} strokeWidth={3} fill="none" opacity={0.7} />
      {Array.from({ length: Math.round(w / TILE) * 2 }).map((_, i) => {
        const bx = x0 + 18 + rand(seed * 3 + i) * (w - 36);
        return (
          <path
            key={i}
            d={`M ${bx} ${yTopB + 30} l ${-3} ${12} l ${5} ${8}`}
            stroke={WALL.frontDark}
            strokeWidth={2.5}
            fill="none"
            opacity={0.6}
          />
        );
      })}
      <rect x={x0} y={yTop} width={w} height={yTopB - yTop} rx={6} fill={WALL.top} />
      <rect x={x0} y={yTopB - 7} width={w} height={7} fill={WALL.topDark} opacity={0.8} />
      <rect x={x0 + 4} y={yTop + 3} width={w - 8} height={5} rx={2.5} fill={WALL.topLight} opacity={0.9} />
      {Array.from({ length: Math.round(w / TILE) * 2 }).map((_, i) => {
        const r1 = rand(seed * 7 + i * 3.1);
        const r2 = rand(seed * 11 + i * 5.7);
        return (
          <path
            key={`s${i}`}
            d={`M ${x0 + 14 + r1 * (w - 40)} ${yTop + 18 + r2 * (yTopB - yTop - 34)} l 8 3 l 6 -4`}
            stroke={WALL.topDark}
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
          />
        );
      })}
    </g>
  );
};

export const WallShadow: React.FC<{ x0: number; x1: number; y0: number }> = ({ x0, x1, y0 }) => (
  <rect x={x0 - 16} y={y0 * T + 10} width={x1 - x0 + 10} height={TILE * T + 10} rx={10} fill="#c9714a" opacity={0.45} />
);

// Golden, wheat-like tall grass as in the reference arena.
const BUSH = { dark: "#e0902a", mid: "#f5b736", light: "#ffd84f", tip: "#ffeb8a" };

export const Bush: React.FC<{ col: number; row: number; frame: number; opacity?: number }> = ({ col, row, frame, opacity = 1 }) => {
  const x0 = col * TILE;
  const y0 = row * TILE;
  const blades = Array.from({ length: 13 }).map((_, i) => ({
    bx: 0.12 + rand(col * 31 + row * 17 + i) * 0.76,
    by: 0.15 + (i / 13) * 0.8,
    h: 58 + rand(col * 7 + row * 3 + i * 5) * 26,
    w: 13 + rand(i * 9 + col) * 7,
    lean: (rand(i * 4 + row) - 0.5) * 14,
    i,
  }));
  return (
    <g opacity={opacity}>
      <ellipse cx={x0 + 46} cy={(y0 + 62) * T} rx={56} ry={36} fill="#c9714a" opacity={0.35} />
      {blades.map(({ bx, by, h, w, lean, i }) => {
        const sway = Math.sin(frame / 16 + col * 1.3 + row * 0.7 + i * 0.6) * 3;
        const cx = x0 + bx * TILE;
        const gy = (y0 + by * TILE) * T;
        const top = gy - h * V;
        const tipX = cx + lean + sway;
        const col1 = i % 3 === 0 ? BUSH.light : i % 3 === 1 ? BUSH.mid : BUSH.dark;
        return (
          <g key={i}>
            <path
              d={`M ${cx - w} ${gy} Q ${cx - w * 0.9} ${gy - h * V * 0.6} ${tipX} ${top} Q ${cx + w * 0.9} ${gy - h * V * 0.6} ${cx + w} ${gy} Z`}
              fill={col1}
              stroke={BUSH.dark}
              strokeWidth={1.5}
            />
            <path d={`M ${cx} ${gy - 4} Q ${cx + lean * 0.3} ${gy - h * V * 0.6} ${tipX} ${top + 6}`} stroke={BUSH.tip} strokeWidth={2.5} fill="none" opacity={0.8} />
          </g>
        );
      })}
    </g>
  );
};

export const PowerCubeIcon: React.FC<{ x: number; y: number; s: number; glow?: number }> = ({ x, y, s, glow = 0 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {glow > 0 ? <circle r={26} fill="#7dff6a" opacity={0.35 * glow} /> : null}
    {/* isometric cube */}
    <path d="M 0 -16 L 15 -8 L 0 0 L -15 -8 Z" fill="#9dff7a" stroke="#1d5e12" strokeWidth={2.5} strokeLinejoin="round" />
    <path d="M -15 -8 L 0 0 L 0 17 L -15 9 Z" fill="#4fd13a" stroke="#1d5e12" strokeWidth={2.5} strokeLinejoin="round" />
    <path d="M 15 -8 L 0 0 L 0 17 L 15 9 Z" fill="#2fa324" stroke="#1d5e12" strokeWidth={2.5} strokeLinejoin="round" />
    <path d="M -6 -9 L 0 -12 L 6 -9" stroke="#e8ffd8" strokeWidth={2} fill="none" strokeLinecap="round" />
  </g>
);

export const Crate: React.FC<{ col: number; row: number }> = ({ col, row }) => {
  const x0 = col * TILE + 12;
  const w = TILE - 24;
  const y0 = row * TILE + 14;
  const d = TILE - 28;
  const h = 70;
  const yTop = y0 * T - h * V;
  const yTopB = (y0 + d) * T - h * V;
  const yBot = (y0 + d) * T;
  return (
    <g>
      <rect x={x0 + 8} y={y0 * T + 12} width={w + 10} height={d * T + 4} rx={8} fill="#c9714a" opacity={0.45} />
      <rect x={x0} y={yTopB} width={w} height={yBot - yTopB} rx={5} fill="#d98a4a" stroke="#8a4a22" strokeWidth={3} />
      {[0.33, 0.66].map((k) => (
        <line key={k} x1={x0 + 4} y1={yTopB + (yBot - yTopB) * k} x2={x0 + w - 4} y2={yTopB + (yBot - yTopB) * k} stroke="#b06a32" strokeWidth={2} />
      ))}
      <rect x={x0} y={yTopB} width={9} height={yBot - yTopB} fill="#b06a32" />
      <rect x={x0 + w - 9} y={yTopB} width={9} height={yBot - yTopB} fill="#b06a32" />
      <rect x={x0} y={yTop} width={w} height={yTopB - yTop} rx={5} fill="#f2a862" stroke="#8a4a22" strokeWidth={3} />
      <path d={`M ${x0 + 6} ${yTop + 4} L ${x0 + w - 6} ${yTopB - 4} M ${x0 + w - 6} ${yTop + 4} L ${x0 + 6} ${yTopB - 4}`} stroke="#c27a3c" strokeWidth={6} />
      <rect x={x0 + 2} y={yTop + 2} width={w - 4} height={yTopB - yTop - 4} rx={4} fill="none" stroke="#c27a3c" strokeWidth={4} />
      <PowerCubeIcon x={x0 + w / 2} y={(yTopB + yBot) / 2 + 1} s={0.95} />
    </g>
  );
};

export const Cactus: React.FC<{ col: number; row: number }> = ({ col, row }) => {
  const cx = col * TILE + 50;
  const gy = (row * TILE + 60) * T;
  const g = "#4f9a3a";
  const line = "#1f4a14";
  const trunk = (x: number, y0: number, y1: number, w: number) => (
    <g>
      <line x1={x} y1={y0} x2={x} y2={y1} stroke={line} strokeWidth={w + 5} strokeLinecap="round" />
      <line x1={x} y1={y0} x2={x} y2={y1} stroke={g} strokeWidth={w} strokeLinecap="round" />
      <line x1={x - w * 0.2} y1={y0 - 3} x2={x - w * 0.2} y2={y1 + 3} stroke="#7cc65a" strokeWidth={w * 0.25} strokeLinecap="round" />
    </g>
  );
  return (
    <g>
      <ellipse cx={cx - 8} cy={gy + 4} rx={30} ry={12} fill="#c9714a" opacity={0.5} />
      {trunk(cx, gy - 6, gy - 92, 30)}
      <path d={`M ${cx - 12} ${gy - 46} Q ${cx - 34} ${gy - 46} ${cx - 34} ${gy - 70}`} stroke={line} strokeWidth={21} fill="none" strokeLinecap="round" />
      <path d={`M ${cx - 12} ${gy - 46} Q ${cx - 34} ${gy - 46} ${cx - 34} ${gy - 70}`} stroke={g} strokeWidth={16} fill="none" strokeLinecap="round" />
      <path d={`M ${cx + 12} ${gy - 58} Q ${cx + 32} ${gy - 58} ${cx + 32} ${gy - 80}`} stroke={line} strokeWidth={19} fill="none" strokeLinecap="round" />
      <path d={`M ${cx + 12} ${gy - 58} Q ${cx + 32} ${gy - 58} ${cx + 32} ${gy - 80}`} stroke={g} strokeWidth={14} fill="none" strokeLinecap="round" />
      <circle cx={cx + 4} cy={gy - 104} r={6} fill="#ff6fa8" stroke="#8a1f4a" strokeWidth={2} />
      {[0, 1, 2, 3].map((i) => (
        <circle key={i} cx={cx + (i % 2 ? 6 : -6)} cy={gy - 24 - i * 18} r={1.6} fill="#f4f0d0" />
      ))}
    </g>
  );
};

export const Barrel: React.FC<{ col: number; row: number }> = ({ col, row }) => {
  const cx = col * TILE + 50;
  const gy = (row * TILE + 60) * T;
  const r = 28;
  const h = 62 * V;
  return (
    <g>
      <ellipse cx={cx + 8} cy={gy + 4} rx={r + 6} ry={r * T * 0.6} fill="#c9714a" opacity={0.5} />
      <path
        d={`M ${cx - r} ${gy - h} L ${cx - r} ${gy} A ${r} ${r * 0.45} 0 0 0 ${cx + r} ${gy} L ${cx + r} ${gy - h} Z`}
        fill="#b8692f"
        stroke="#6a3416"
        strokeWidth={3}
      />
      {[0.25, 0.75].map((k) => (
        <path key={k} d={`M ${cx - r} ${gy - h * (1 - k)} A ${r} ${r * 0.45} 0 0 0 ${cx + r} ${gy - h * (1 - k)}`} stroke="#5f7393" strokeWidth={6} fill="none" />
      ))}
      <rect x={cx + r * 0.35} y={gy - h + 4} width={6} height={h - 4} fill="#c87a42" opacity={0.6} />
      <ellipse cx={cx} cy={gy - h} rx={r} ry={r * 0.45} fill="#d58a4a" stroke="#5f7393" strokeWidth={5} />
      <ellipse cx={cx} cy={gy - h} rx={r * 0.6} ry={r * 0.26} fill="#8a4a22" opacity={0.6} />
    </g>
  );
};

export const GroundDecor: React.FC<{ col: number; row: number }> = ({ col, row }) => {
  const cx = col * TILE + 50;
  const cy = (row * TILE + 50) * T;
  return (
    <g>
      {Array.from({ length: 9 }).map((_, i) => {
        const x = cx + (rand(col * 9 + i) - 0.5) * 90;
        const y = cy + (rand(row * 7 + i * 3) - 0.5) * 50;
        const r = 7 + rand(i * 5 + col) * 9;
        return (
          <path
            key={i}
            d={`M ${x - r} ${y} L ${x - r * 0.3} ${y - r * 0.6} L ${x + r * 0.8} ${y - r * 0.3} L ${x + r * 0.6} ${y + r * 0.5} L ${x - r * 0.4} ${y + r * 0.5} Z`}
            fill={i % 2 ? "#e98d62" : "#f4a57a"}
            stroke="#c9714a"
            strokeWidth={2}
          />
        );
      })}
    </g>
  );
};
