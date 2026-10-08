import React from "react";
import { AbsoluteFill } from "remotion";
import { clamp01, easeIn, lerp } from "../engine/math";

// The spin becomes a dream: warm spiral arms swirl out from El Primo's head
// and swallow the arena, then dissolve into the first fantasy.

export const Vortex: React.FC<{ frame: number; start: number; mid: number; end: number; cx: number; cy: number }> = ({
  frame,
  start,
  mid,
  end,
  cx,
  cy,
}) => {
  if (frame < start || frame >= end) return null;
  const grow = lerp(frame, [start, mid], [0, 1], easeIn);
  const fade = lerp(frame, [mid, end], [1, 0]);
  const rot = (frame - start) * 9;
  const arms = 7;
  const colors = ["#ffd36a", "#ff8fb8", "#fff2c8", "#ffb35a"];
  const maxR = 140 + grow * 1500;
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <svg width={1920} height={1080}>
        <defs>
          <radialGradient id="vortexCore" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#fffbe8" stopOpacity={1} />
            <stop offset="1" stopColor="#ffd8a0" stopOpacity={0} />
          </radialGradient>
        </defs>
        <g transform={`translate(${cx} ${cy}) rotate(${rot})`} opacity={clamp01(grow * 1.6)}>
          {Array.from({ length: arms }).map((_, i) => {
            const pts: string[] = [];
            const pts2: string[] = [];
            for (let k = 0; k <= 30; k++) {
              const t = k / 30;
              const r = t * maxR;
              const a = (i / arms) * Math.PI * 2 + t * 4.2;
              const w = 0.18 + t * 0.32;
              pts.push(`${Math.cos(a) * r} ${Math.sin(a) * r}`);
              pts2.unshift(`${Math.cos(a + w) * r} ${Math.sin(a + w) * r}`);
            }
            return <path key={i} d={`M ${pts.join(" L ")} L ${pts2.join(" L ")} Z`} fill={colors[i % colors.length]} opacity={0.85} />;
          })}
          <circle r={60 + grow * 700} fill="url(#vortexCore)" />
        </g>
        <rect width={1920} height={1080} fill="#fff4d8" opacity={clamp01((grow - 0.75) * 4) * 0.9} />
      </svg>
    </AbsoluteFill>
  );
};
