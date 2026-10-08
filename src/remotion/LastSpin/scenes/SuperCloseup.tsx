import React from "react";
import { AbsoluteFill } from "remotion";
import { BEAT } from "../constants";
import { clamp01, lerp, pop } from "../engine/math";
import { RealityScene } from "./RealityScene";

// The decisive cut: Shelly's Super button. The ring completes and the button
// flips to bright yellow with a burst — anyone who plays knows what's next.

const ShellIcon: React.FC<{ lit: boolean }> = ({ lit }) => {
  const shell = (rot: number) => (
    <g transform={`rotate(${rot}) translate(0 -18)`}>
      <rect x={-13} y={-46} width={26} height={44} rx={9} fill={lit ? "#ff4a3a" : "#8a7a70"} stroke="#120a06" strokeWidth={6} />
      <rect x={-15} y={-8} width={30} height={16} rx={4} fill={lit ? "#ffd84a" : "#b0a69a"} stroke="#120a06" strokeWidth={6} />
    </g>
  );
  return (
    <g>
      {shell(-32)}
      {shell(32)}
      {shell(0)}
      <path d="M -60 40 L 60 40" stroke="#120a06" strokeWidth={0} />
    </g>
  );
};

export const SuperCloseup: React.FC<{ frame: number }> = ({ frame: f }) => {
  const ring = lerp(f, [BEAT.closeupStart, BEAT.superReadyCue], [0.86, 1]);
  const lit = f >= BEAT.superReadyCue;
  const s = lit ? 1 + (pop(f, BEAT.superReadyCue, 8) - 1) * 0.6 + 0.04 * Math.sin((f - BEAT.superReadyCue) * 1.4) : 0.96;
  const flash = lit ? clamp01(1 - (f - BEAT.superReadyCue) / 5) : 0;
  const zoomIn = lerp(f, [BEAT.closeupStart, BEAT.closeupEnd], [1, 1.06]);
  const R = 190;
  const cx = 1180;
  const cy = 600;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ filter: "blur(10px) brightness(0.5) saturate(0.8)", scale: "1.15" }}>
        <RealityScene frame={BEAT.closeupStart} />
      </AbsoluteFill>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, scale: String(zoomIn) }}>
        <defs>
          <radialGradient id="superBtn" cx="40%" cy="35%" r="70%">
            <stop offset="0" stopColor="#fff8b0" />
            <stop offset="0.5" stopColor="#ffd21f" />
            <stop offset="1" stopColor="#f0a000" />
          </radialGradient>
        </defs>
        {lit ? (
          <g opacity={0.9}>
            {Array.from({ length: 18 }).map((_, i) => {
              const a = (i / 18) * Math.PI * 2 + f * 0.04;
              const r0 = R + 30;
              const r1 = R + 140 + (i % 2) * 60;
              return (
                <path
                  key={i}
                  d={`M ${cx + Math.cos(a - 0.05) * r0} ${cy + Math.sin(a - 0.05) * r0} L ${cx + Math.cos(a) * r1} ${cy + Math.sin(a) * r1} L ${cx + Math.cos(a + 0.05) * r0} ${cy + Math.sin(a + 0.05) * r0} Z`}
                  fill="#ffe14a"
                />
              );
            })}
            <circle cx={cx} cy={cy} r={R + 70} fill="#ffd21f" opacity={0.25} />
          </g>
        ) : null}
        <g transform={`translate(${cx} ${cy}) scale(${s})`}>
          <circle r={R + 26} fill="#120a06" opacity={0.6} />
          <circle r={R + 12} fill="none" stroke="#3a2a10" strokeWidth={24} />
          <circle
            r={R + 12}
            fill="none"
            stroke="#ffd21f"
            strokeWidth={24}
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * (R + 12) * ring} 9999`}
            transform="rotate(-90)"
          />
          <circle r={R} fill={lit ? "url(#superBtn)" : "#6b6253"} stroke="#120a06" strokeWidth={10} />
          <ellipse cx={-R * 0.32} cy={-R * 0.42} rx={R * 0.38} ry={R * 0.18} fill="#fff" opacity={lit ? 0.5 : 0.15} transform={`rotate(-30 ${-R * 0.32} ${-R * 0.42})`} />
          <g transform="translate(0 18) scale(2.5)">
            <ShellIcon lit={lit} />
          </g>
        </g>
      </svg>
      <AbsoluteFill style={{ background: "#fff6c0", opacity: flash * 0.6 }} />
    </AbsoluteFill>
  );
};
