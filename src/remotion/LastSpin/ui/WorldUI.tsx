import React from "react";
import { FONT } from "../constants";
import { clamp01, pop } from "../engine/math";
import { PowerCubeIcon } from "../world/Props";

// UI that floats in world space above brawlers (inside the Arena transform).

const outlineText = {
  fontFamily: FONT,
  paintOrder: "stroke" as const,
  stroke: "#1a0f0a",
  strokeLinejoin: "round" as const,
};

/** Team ring painted on the ground under a brawler (blue = you, red = enemy). */
export const TeamRing: React.FC<{ x: number; y: number; color: "blue" | "red"; opacity?: number }> = ({ x, y, color, opacity = 1 }) => {
  const c = color === "blue" ? "#3aa0ff" : "#ff4a4a";
  return (
    <g transform={`translate(${x} ${y})`} opacity={opacity}>
      <ellipse rx={58} ry={58 * 0.72} fill={c} opacity={0.22} />
      <ellipse rx={58} ry={58 * 0.72} fill="none" stroke={c} strokeWidth={6} opacity={0.75} />
      <ellipse rx={72} ry={72 * 0.72} fill="none" stroke={c} strokeWidth={4} opacity={0.4} strokeDasharray="40 22" />
    </g>
  );
};

/**
 * Floating health bar in the reference style: power-cube count and player name
 * above a rounded bar with the HP number drawn inside it.
 */
export const HealthBar: React.FC<{
  x: number;
  y: number; // projected anchor (top of head)
  hp: number;
  max: number;
  color: "green" | "red";
  name?: string;
  prevHp?: number; // white "recent damage" chunk
  ammo?: number; // 0..3 segments (player only)
  superCharge?: number; // tiny gauge next to the bar
  superReady?: boolean;
  cubes?: number;
  opacity?: number;
  frame: number;
}> = ({ x, y, hp, max, color, name, prevHp, ammo, superCharge, superReady, cubes = 0, opacity = 1, frame }) => {
  const w = 112;
  const h = 26;
  const fillCol = color === "green" ? "#4fd14a" : "#f0414a";
  const dark = color === "green" ? "#2a8a22" : "#a8202a";
  const frac = clamp01(hp / max);
  const prevFrac = clamp01((prevHp ?? hp) / max);
  return (
    <g transform={`translate(${x} ${y})`} opacity={opacity}>
      <g transform="translate(0 -42)">
        <PowerCubeIcon x={-12} y={0} s={0.62} />
        <text x={6} y={9} fontSize={26} fill="#4fe04a" strokeWidth={5} style={outlineText}>
          {cubes}
        </text>
      </g>
      {name ? (
        <text x={0} y={-12} textAnchor="middle" fontSize={17} fill={color === "green" ? "#dfffd0" : "#ffd6d6"} strokeWidth={4} style={outlineText}>
          {name}
        </text>
      ) : null}
      <rect x={-w / 2 - 3} y={-3} width={w + 6} height={h + 6} rx={10} fill="#1a0f0a" />
      <rect x={-w / 2} y={0} width={w} height={h} rx={8} fill="#4a2f2a" />
      {prevFrac > frac ? <rect x={-w / 2} y={0} width={w * prevFrac} height={h} rx={8} fill="#fff" /> : null}
      {frac > 0 ? <rect x={-w / 2} y={0} width={w * frac} height={h} rx={8} fill={fillCol} /> : null}
      {frac > 0 ? <rect x={-w / 2} y={h * 0.6} width={w * frac} height={h * 0.4} rx={6} fill={dark} opacity={0.5} /> : null}
      <text x={0} y={h - 5} textAnchor="middle" fontSize={23} fill="#fff" strokeWidth={5} style={outlineText}>
        {Math.round(hp)}
      </text>
      {ammo !== undefined ? (
        <g>
          {[0, 1, 2].map((i) => (
            <rect
              key={i}
              x={-w / 2 + i * (w / 3) + 1}
              y={h + 6}
              width={w / 3 - 2}
              height={8}
              rx={2}
              fill={i < ammo ? "#ff9a1f" : "#5a3a1a"}
              stroke="#1a0f0a"
              strokeWidth={2}
            />
          ))}
        </g>
      ) : null}
      {superCharge !== undefined ? (
        <g transform={`translate(${w / 2 + 20} ${h / 2})`}>
          {superReady ? <circle r={19 + Math.sin(frame / 2) * 2} fill="#ffd21f" opacity={0.5} /> : null}
          <circle r={12} fill="#1a0f0a" />
          <circle r={8.5} fill="none" stroke="#5a4a2a" strokeWidth={5} />
          <circle
            r={8.5}
            fill="none"
            stroke="#ffd21f"
            strokeWidth={5}
            strokeDasharray={`${2 * Math.PI * 8.5 * clamp01(superCharge)} 999`}
            transform="rotate(-90)"
          />
          {superReady ? <circle r={6} fill="#fff6a8" /> : null}
        </g>
      ) : null}
    </g>
  );
};

export const DamageNumber: React.FC<{ x: number; y: number; value: number; start: number; frame: number; big?: boolean }> = ({
  x,
  y,
  value,
  start,
  frame,
  big,
}) => {
  const t = frame - start;
  if (t < 0 || t > 26) return null;
  const s = pop(frame, start, 8) * (big ? 1.5 : 1.05);
  const rise = t * 1.6;
  const op = t < 18 ? 1 : 1 - (t - 18) / 8;
  return (
    <g transform={`translate(${x + (big ? 10 : 0)} ${y - rise}) scale(${s})`} opacity={op}>
      <text
        textAnchor="middle"
        fontSize={34}
        fill={big ? "#ffe14a" : "#ffffff"}
        strokeWidth={7}
        style={outlineText}
      >
        {value}
      </text>
    </g>
  );
};

// --- Pins -------------------------------------------------------------------
export type PinKind = "heart" | "happy";

export const Heart: React.FC<{ s?: number; color?: string; shine?: boolean }> = ({ s = 1, color = "#ff3b5c", shine = true }) => (
  <g transform={`scale(${s})`}>
    <path
      d="M 0 22 C -30 2 -34 -16 -20 -24 C -10 -30 -2 -24 0 -16 C 2 -24 10 -30 20 -24 C 34 -16 30 2 0 22 Z"
      fill={color}
      stroke="#5a0b1c"
      strokeWidth={4}
      strokeLinejoin="round"
    />
    <path d="M 0 22 C 18 10 26 -2 24 -12 C 18 2 10 10 0 22 Z" fill="#000" opacity={0.18} />
    {shine ? <ellipse cx={-14} cy={-14} rx={7} ry={4.5} fill="#fff" opacity={0.85} transform="rotate(-30 -14 -14)" /> : null}
  </g>
);

// Pin artwork in the flat, thick-outline style of the reference Pins (C, D).
const K = "#120a10";

/** El Primo heart-eyes Pin: blue mask, pink heart eyes, huge toothy grin. */
export const PrimoLovePin: React.FC<{ frame: number }> = ({ frame }) => {
  const beat = 1 + Math.max(0, Math.sin(frame / 4)) * 0.08;
  return (
    <g>
      <path d="M -34 10 Q -36 -40 0 -40 Q 36 -40 34 10 Q 30 34 0 36 Q -30 34 -34 10 Z" fill="#2f7be6" stroke={K} strokeWidth={5} />
      <path d="M -6 -36 Q 0 -46 4 -38 Q 8 -32 2 -28 Q -4 -30 -6 -36 Z" fill="#ff9a1e" stroke={K} strokeWidth={2.5} />
      {[-1, 1].map((sd) => (
        <g key={sd} transform={`translate(${sd * 14} -12) scale(${beat * 0.48})`}>
          <path d="M 0 22 C -30 2 -34 -16 -20 -24 C -10 -30 -2 -24 0 -16 C 2 -24 10 -30 20 -24 C 34 -16 30 2 0 22 Z" fill="#ff3d8a" stroke={K} strokeWidth={6} />
          <circle cx={-12} cy={-12} r={5} fill="#fff" />
        </g>
      ))}
      <path d="M -24 6 Q -26 30 0 31 Q 26 30 24 6 Z" fill="#ff8a24" stroke={K} strokeWidth={4} />
      <path d="M -18 8 L 18 8 Q 18 22 0 23 Q -18 22 -18 8 Z" fill="#fffaf0" stroke={K} strokeWidth={3} />
      <path d="M -9 8 L -9 22 M 0 8 L 0 23 M 9 8 L 9 22" stroke={K} strokeWidth={2.5} />
      <g transform="translate(-36 26) rotate(-30)">
        <rect x={-10} y={-12} width={20} height={24} rx={5} fill="#22d0ff" stroke={K} strokeWidth={4} />
        <path d="M -10 -2 L 10 -2 M -10 6 L 10 6" stroke={K} strokeWidth={2.5} />
      </g>
      <g transform="translate(36 26) rotate(30)">
        <rect x={-10} y={-12} width={20} height={24} rx={5} fill="#22d0ff" stroke={K} strokeWidth={4} />
        <path d="M -10 -2 L 10 -2 M -10 6 L 10 6" stroke={K} strokeWidth={2.5} />
      </g>
    </g>
  );
};

/** Shelly "happy" Pin: closed smiling eyes, blush, band-aid. */
const ShellyFace: React.FC = () => (
  <g>
    <circle cx={-24} cy={-14} r={15} fill="#b45ef0" stroke={K} strokeWidth={4} />
    <circle cx={24} cy={-14} r={15} fill="#b45ef0" stroke={K} strokeWidth={4} />
    <path d="M -28 -6 Q -30 -36 0 -36 Q 30 -36 28 -6 L 26 20 Q 14 34 0 36 Q -14 34 -26 20 Z" fill="#b45ef0" stroke={K} strokeWidth={4} />
    <path d="M -22 -6 L -22 18 Q -10 32 0 33 Q 10 32 22 18 L 22 -6 Q 10 -12 0 -4 Q -10 -12 -22 -6 Z" fill="#e0895e" stroke={K} strokeWidth={3.5} />
    <path d="M -24 -10 Q -6 -40 26 -18 Q 10 -20 -2 -6 Z" fill="#c776ff" stroke={K} strokeWidth={3.5} />
    <path d="M -15 6 Q -9 0 -3 6" stroke={K} strokeWidth={4} fill="none" strokeLinecap="round" />
    <path d="M 3 6 Q 9 0 15 6" stroke={K} strokeWidth={4} fill="none" strokeLinecap="round" />
    <path d="M -5 16 Q 0 21 5 16" stroke={K} strokeWidth={3} fill="none" strokeLinecap="round" />
    <ellipse cx={-14} cy={14} rx={5} ry={3} fill="#ff5a9a" />
    <ellipse cx={14} cy={14} rx={5} ry={3} fill="#ff5a9a" />
    <rect x={12} y={16} width={9} height={6} rx={2} fill="#f6dcc0" transform="rotate(-30 16 19)" />
  </g>
);

/**
 * Brawl Stars-style Pin: rounded outlined bubble with a tail, popping in with
 * an overshoot. `sat` desaturates the pin's color (used in the final shot).
 */
export const Pin: React.FC<{
  x: number;
  y: number;
  kind: PinKind;
  start: number;
  frame: number;
  end?: number;
  scale?: number;
  sat?: number;
  bubble?: boolean;
}> = ({ x, y, kind, start, frame, end = 99999, scale = 1, sat = 1, bubble = true }) => {
  if (frame < start) return null;
  const sIn = pop(frame, start, 9);
  const sOut = end < 99999 ? clamp01(1 - (frame - end) / 6) : 1;
  if (sOut <= 0) return null;
  const bobY = Math.sin((frame - start) / 7) * 3;
  const s = sIn * scale * (0.7 + 0.3 * sOut);
  const heartCol = mixHex("#8a8a8a", "#ff3b5c", sat);
  return (
    <g transform={`translate(${x} ${y + bobY}) scale(${s})`} opacity={sOut} style={sat < 1 ? { filter: `saturate(${sat})` } : undefined}>
      {bubble ? (
        <>
          <path
            d="M -56 -42 Q -56 -90 0 -90 Q 56 -90 56 -42 Q 56 0 10 2 L 0 16 L -10 2 Q -56 0 -56 -42 Z"
            fill="#ffffff"
            stroke="#1a0f0a"
            strokeWidth={5}
            strokeLinejoin="round"
          />
          
        </>
      ) : null}
      <g transform="translate(0 -44)">
        {kind === "heart" ? (
          <g>
            <g transform="scale(0.92)">
              <PrimoLovePin frame={frame - start} />
            </g>
            <g transform="translate(34 -30) scale(0.42)">
              <Heart color={heartCol} />
            </g>
            <path d="M -40 -30 l 3 -8 l 3 8 l 8 3 l -8 3 l -3 8 l -3 -8 l -8 -3 Z" fill="#ffe14a" stroke={K} strokeWidth={2} />
          </g>
        ) : (
          <ShellyFace />
        )}
      </g>
    </g>
  );
};

const mixHex = (a: string, b: string, t: number) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (n: number, sh: number) => (n >> sh) & 255;
  const m = (sh: number) => Math.round(ch(pa, sh) + (ch(pb, sh) - ch(pa, sh)) * clamp01(t));
  return `#${((1 << 24) | (m(16) << 8 * 2) | (m(8) << 8) | m(0)).toString(16).slice(1)}`;
};
