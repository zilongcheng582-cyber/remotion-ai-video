import React from "react";
import { rand } from "../engine/math";
import { toWorld, V3 } from "../engine/rig";

// Fantasy cinematography: lower, side-on camera than the gameplay view.
export const FT = 0.24;
export const FV = 1;

/** Character-local point -> offset in the character's own drawing space. */
export const localToScreen = (p: V3, phi: number, t = FT, v = FV): [number, number] => {
  const [wx, wd, z] = toWorld(p, phi);
  return [wx, wd * t - z * v];
};

export const Net: React.FC<{ hand: [number, number]; angle: number; catchJelly?: boolean; frame: number }> = ({
  hand,
  angle,
  catchJelly,
  frame,
}) => (
  <g transform={`translate(${hand[0]} ${hand[1]}) rotate(${angle})`}>
    <line x1={0} y1={14} x2={0} y2={-92} stroke="#2b1608" strokeWidth={9} strokeLinecap="round" />
    <line x1={0} y1={14} x2={0} y2={-92} stroke="#e8c27a" strokeWidth={5} strokeLinecap="round" />
    <ellipse cx={0} cy={-114} rx={22} ry={24} fill="none" stroke="#2b1608" strokeWidth={5} />
    <path d="M -22 -114 Q -14 -76 0 -70 Q 14 -76 22 -114" fill="#ffffff" opacity={0.55} stroke="#2b1608" strokeWidth={2} />
    <path d="M -14 -104 L 12 -82 M 14 -104 L -10 -82 M -20 -96 L 20 -96" stroke="#2b1608" strokeWidth={1.2} opacity={0.6} />
    {catchJelly ? (
      <g transform={`translate(0 ${-98 + Math.sin(frame / 3) * 2})`}>
        <Jellyfish s={0.45} frame={frame} />
      </g>
    ) : null}
  </g>
);

export const Jellyfish: React.FC<{ s?: number; frame: number; color?: string }> = ({ s = 1, frame, color = "#ff8fc8" }) => {
  const pulse = 1 + Math.sin(frame / 5) * 0.08;
  return (
    <g transform={`scale(${s})`}>
      {[-18, -6, 6, 18].map((x, i) => (
        <path
          key={i}
          d={`M ${x} 6 q ${Math.sin(frame / 4 + i) * 6} 18 0 36 q ${-Math.sin(frame / 4 + i) * 6} 14 0 26`}
          stroke={color}
          strokeWidth={4}
          fill="none"
          strokeLinecap="round"
          opacity={0.85}
        />
      ))}
      <path
        d={`M -30 8 Q -30 ${-30 * pulse} 0 ${-32 * pulse} Q 30 ${-30 * pulse} 30 8 Q 15 2 0 8 Q -15 2 -30 8 Z`}
        fill={color}
        stroke="#a43a78"
        strokeWidth={3}
      />
      <circle cx={-10} cy={-12} r={5} fill="#ffd2ea" />
      <circle cx={8} cy={-18} r={3.5} fill="#ffd2ea" />
    </g>
  );
};

export const Propeller: React.FC<{ x: number; y: number; frame: number; speed?: number; sputter?: number }> = ({
  x,
  y,
  frame,
  speed = 1,
  sputter = 0,
}) => {
  const w = 44 * Math.abs(Math.cos(frame * 1.7 * speed));
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-4} y={-26} width={8} height={26} rx={3} fill="#f7c948" stroke="#2b1608" strokeWidth={2.5} />
      <ellipse cx={0} cy={-28} rx={52} ry={7} fill="#ffe28a" opacity={0.35 * speed} />
      <rect x={-w} y={-31} width={w * 2} height={6} rx={3} fill="#f7c948" stroke="#2b1608" strokeWidth={2.5} />
      <circle cx={0} cy={-28} r={5} fill="#e85a3a" stroke="#2b1608" strokeWidth={2} />
      {sputter > 0
        ? [0, 1, 2].map((i) => (
            <circle
              key={i}
              cx={-20 - i * 18 + Math.sin(frame + i) * 4}
              cy={-30 - i * 12}
              r={10 + i * 5}
              fill="#5a5a66"
              opacity={0.5 * sputter * (1 - i * 0.25)}
            />
          ))
        : null}
    </g>
  );
};

export const Bubbles: React.FC<{ frame: number; count?: number; seed?: number; opacity?: number }> = ({
  frame,
  count = 26,
  seed = 1,
  opacity = 1,
}) => (
  <g opacity={opacity}>
    {Array.from({ length: count }).map((_, i) => {
      const r = 6 + rand(i * 7 + seed) * 20;
      const speed = 1.2 + rand(i * 3 + seed) * 2.5;
      const x = rand(i * 11 + seed) * 1920 + Math.sin(frame / 12 + i) * 12;
      const y = 1140 - (((frame * speed + rand(i * 5 + seed) * 1300) % 1300) as number);
      return (
        <g key={i}>
          <circle cx={x} cy={y} r={r} fill="#ffffff" opacity={0.18} stroke="#ffffff" strokeOpacity={0.7} strokeWidth={2.5} />
          <circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.25} fill="#fff" opacity={0.8} />
        </g>
      );
    })}
  </g>
);

export const Sparkle: React.FC<{ x: number; y: number; s: number; color?: string; rot?: number }> = ({
  x,
  y,
  s,
  color = "#fff6b0",
  rot = 0,
}) => (
  <path
    d="M 0 -20 Q 3 -3 20 0 Q 3 3 0 20 Q -3 3 -20 0 Q -3 -3 0 -20 Z"
    fill={color}
    transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}
  />
);

/** Soft cinematic vignette + warm grade overlay for fantasy shots. */
export const DreamFrame: React.FC<{ warmth?: number }> = ({ warmth = 0.18 }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
    <defs>
      <radialGradient id="dreamVig" cx="50%" cy="50%" r="75%">
        <stop offset="55%" stopColor="#fff2d0" stopOpacity={0} />
        <stop offset="100%" stopColor="#7a3a12" stopOpacity={0.45} />
      </radialGradient>
    </defs>
    <rect width={1920} height={1080} fill="#ffcf8a" opacity={warmth} style={{ mixBlendMode: "soft-light" }} />
    <rect width={1920} height={1080} fill="url(#dreamVig)" />
  </svg>
);
