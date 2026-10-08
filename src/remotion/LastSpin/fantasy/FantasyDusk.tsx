import React from "react";
import { AbsoluteFill } from "remotion";
import { ElPrimo } from "../characters/ElPrimo";
import { Shelly } from "../characters/Shelly";
import { lerp, rand, track } from "../engine/math";
import { V3 } from "../engine/rig";
import { DreamFrame, FT, FV, localToScreen, Propeller, Sparkle } from "./common";

// Fantasy B — "I'll always be there": an original, nostalgic homage to classic
// childhood-friendship cartoons — flying over a quiet suburb at dusk with
// little head propellers, past an empty lot with three concrete pipes.
// When El Primo's propeller sputters, Shelly catches his hand.

const S = 2.3;

const House: React.FC<{ x: number; w: number; h: number; roof: string; wall: string; lit: number }> = ({ x, w, h, roof, wall, lit }) => {
  const base = 1080;
  return (
    <g>
      <rect x={x} y={base - h} width={w} height={h} fill={wall} />
      <path d={`M ${x - 18} ${base - h + 4} L ${x + w / 2} ${base - h - w * 0.32} L ${x + w + 18} ${base - h + 4} Z`} fill={roof} />
      <rect x={x + w * 0.2} y={base - h + 30} width={w * 0.22} height={30} fill="#ffd27a" opacity={lit} />
      <rect x={x + w * 0.58} y={base - h + 30} width={w * 0.22} height={30} fill="#ffd27a" opacity={lit * 0.7} />
    </g>
  );
};

export const FantasyDusk: React.FC<{ frame: number }> = ({ frame }) => {
  const lf = frame - 300;
  const pan = lf * 3;
  const sx = 700 + lf * 3.2;
  const sy = 420 + Math.sin(lf / 8) * 10 - lerp(lf, [30, 60], [0, 60]);
  const shellyPhi = 40;
  const primoPhi = 35;
  const grab = lf >= 26;
  // Shelly reaches down toward El Primo after his propeller fails
  const reach = lerp(lf, [20, 26], [0, 1]);
  const shellyArms = {
    l: (reach > 0 ? [30, 30 + reach * 10, 70 - reach * 60] : [30, 10, 60]) as V3,
    r: [-28, 6, 50] as V3,
  };
  const sHand = localToScreen(shellyArms.l, shellyPhi);
  const primoArms = {
    l: (lf > 16 ? [36, -6, 160] : [52, 8, 120]) as V3,
    r: [-50, 8, 120] as V3,
  };
  const pHand = localToScreen(primoArms.l, primoPhi);
  let px: number;
  let py: number;
  if (!grab) {
    px = 1000 + lf * 3.2;
    const drop = lerp(lf, [17, 27], [0, 1], (t) => t * t);
    py = 460 + Math.sin(lf / 8 + 1) * 10 + drop * 230;
  } else {
    // locked hand in hand, dangling a little
    const dangle = Math.sin((lf - 26) / 5) * 8 * lerp(lf, [26, 50], [1, 0.3]);
    px = sx + sHand[0] * S - pHand[0] * S + dangle;
    py = sy + sHand[1] * S - pHand[1] * S;
  }
  const sputter = lerp(lf, [16, 18], [0, 1]) * lerp(lf, [36, 42], [1, 0]);
  const pSpeed = track(lf, [
    [0, 1],
    [16, 1],
    [20, 0.15],
    [38, 0.15],
    [44, 1],
  ]);
  const primoExpr =
    lf < 17
      ? ({ eyes: "happy", mouth: "grin" } as const)
      : lf < 32
        ? ({ eyes: "wide", mouth: "o", brow: -1 } as const)
        : ({ eyes: "happy", mouth: "smile" } as const);
  const headP = localToScreen([0, 6, 118 + 26], primoPhi);
  const headS = localToScreen([0, 3, 94 + 28], shellyPhi);
  const tearOn = lf > 34;

  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <defs>
          <linearGradient id="duskSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#6a5ac8" />
            <stop offset="0.38" stopColor="#e97aa0" />
            <stop offset="0.7" stopColor="#ffb07a" />
            <stop offset="1" stopColor="#ffe0a0" />
          </linearGradient>
        </defs>
        <rect width={1920} height={1080} fill="url(#duskSky)" />
        <circle cx={1500} cy={760} r={220} fill="#ffe7a8" opacity={0.45} />
        <circle cx={1500} cy={760} r={140} fill="#fff1c6" />
        {/* soft clouds */}
        {Array.from({ length: 7 }).map((_, i) => {
          const x = ((i * 330 - pan * 0.3 + 3000) % 2300) - 200;
          const y = 140 + rand(i * 5) * 360;
          return (
            <g key={i} opacity={0.7}>
              <ellipse cx={x} cy={y} rx={120} ry={26} fill="#ffd0c0" />
              <ellipse cx={x + 50} cy={y - 18} rx={70} ry={26} fill="#ffe0d0" />
            </g>
          );
        })}
        {/* first stars */}
        {Array.from({ length: 14 }).map((_, i) => (
          <circle key={i} cx={rand(i * 9) * 1920} cy={rand(i * 4) * 260} r={2 + rand(i) * 2} fill="#fff" opacity={0.4 + 0.4 * Math.sin(lf / 5 + i)} />
        ))}
        {/* far town */}
        <g transform={`translate(${-pan * 0.5} 0)`} opacity={0.9}>
          {Array.from({ length: 16 }).map((_, i) => (
            <House key={i} x={i * 170 - 100} w={130} h={170 + (i % 3) * 30} roof="#5a3f7a" wall="#7a5a96" lit={0.55} />
          ))}
        </g>
        {/* utility poles + wires */}
        <g transform={`translate(${-pan * 0.8} 0)`}>
          {[200, 900, 1600, 2300].map((x) => (
            <g key={x}>
              <rect x={x} y={640} width={14} height={440} fill="#3a2a4a" />
              <rect x={x - 40} y={660} width={94} height={10} fill="#3a2a4a" />
            </g>
          ))}
          {[0, 1].map((k) => (
            <path key={k} d={`M -200 ${672 + k * 0} Q 550 ${720 + k * 14} 907 ${668} Q 1250 ${716 + k * 14} 1607 ${668} Q 1950 ${716 + k * 14} 2400 ${668}`} stroke="#3a2a4a" strokeWidth={3} fill="none" />
          ))}
        </g>
        {/* near houses */}
        <g transform={`translate(${-pan * 1.1} 0)`}>
          {Array.from({ length: 10 }).map((_, i) => (
            <House key={i} x={i * 300 + 520} w={220} h={190 + (i % 2) * 40} roof="#4a2f5e" wall="#6a4a80" lit={0.9} />
          ))}
        </g>
        {/* empty lot with three concrete pipes */}
        <g transform={`translate(${-pan * 1.3} 0)`}>
          <path d="M -100 940 L 560 930 L 560 1080 L -100 1080 Z" fill="#7a6a5a" />
          <path d="M -100 940 L 560 930" stroke="#a3d06a" strokeWidth={8} />
          {[
            [120, 980],
            [300, 980],
            [210, 880],
          ].map(([x, y], i) => (
            <g key={i}>
              <rect x={x - 90} y={y - 52} width={180} height={104} rx={14} fill="#9a9aa8" stroke="#3a3446" strokeWidth={4} />
              <ellipse cx={x + 90} cy={y} rx={22} ry={52} fill="#5a5a68" stroke="#3a3446" strokeWidth={4} />
              <ellipse cx={x + 90} cy={y} rx={12} ry={38} fill="#2a2834" />
              <rect x={x - 80} y={y - 44} width={150} height={10} rx={5} fill="#c4c4d0" opacity={0.7} />
            </g>
          ))}
        </g>
        {/* characters */}
        <g transform={`translate(${sx} ${sy}) scale(${S})`}>
          <Shelly uid="fb-s" phi={shellyPhi} t={FT} v={FV} gun="back" arms={shellyArms} expr={{ eyes: grab ? "open" : "happy", mouth: "smile" }} shadow={false} walk={lf / 6} walkAmt={0.3} />
          <Propeller x={headS[0]} y={headS[1]} frame={lf} />
        </g>
        <g transform={`translate(${px} ${py}) scale(${S}) rotate(${lf > 17 && lf < 30 ? Math.sin(lf) * 10 : 0})`}>
          <ElPrimo uid="fb-p" phi={primoPhi} t={FT} v={FV} arms={primoArms} expr={primoExpr} shadow={false} walk={lf / 3} walkAmt={lf > 17 && lf < 32 ? 1 : 0.3} />
          <Propeller x={headP[0]} y={headP[1]} frame={lf} speed={pSpeed} sputter={sputter} />
          {tearOn ? (
            <path
              d={`M ${headP[0] + 16} ${headP[1] + 30} q -5 9 0 13 q 5 -4 0 -13 Z`}
              fill="#bfe8ff"
              stroke="#4a8ac8"
              strokeWidth={1.2}
              opacity={lerp(lf, [34, 38], [0, 1])}
            />
          ) : null}
        </g>
        {grab
          ? [0, 1, 2, 3].map((i) => (
              <Sparkle
                key={i}
                x={sx + sHand[0] * S + Math.cos(i * 1.6 + lf / 6) * 40}
                y={sy + sHand[1] * S + Math.sin(i * 1.6 + lf / 6) * 40}
                s={0.7}
                rot={lf * 6}
              />
            ))
          : null}
      </svg>
      <DreamFrame warmth={0.2} />
    </AbsoluteFill>
  );
};
