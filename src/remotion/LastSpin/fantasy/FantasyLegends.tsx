import React from "react";
import { AbsoluteFill } from "remotion";
import { blendArms, ElPrimo, PRIMO_POSES } from "../characters/ElPrimo";
import { Shelly } from "../characters/Shelly";
import { clamp01, lerp, rand, track } from "../engine/math";
import { V3 } from "../engine/rig";
import { DreamFrame, FT, FV, localToScreen, Sparkle } from "./common";

// Fantasy C — "Legendary partners": El Primo imagines years of fighting side
// by side. Three heroic beats, ending in a sunset almost-high-five.

const SilEnemy: React.FC<{ x: number; y: number; s: number; knock: number; frame: number }> = ({ x, y, s, knock, frame }) => (
  <g transform={`translate(${x + knock * 120} ${y - knock * 80}) rotate(${knock * 50}) scale(${s})`} opacity={1 - knock * 0.7}>
    <ellipse cx={0} cy={0} rx={40} ry={10} fill="#3a1030" opacity={0.4} />
    <path d="M -26 0 Q -30 -70 0 -84 Q 30 -70 26 0 Z" fill="#2a1430" />
    <circle cx={0} cy={-96} r={26} fill="#2a1430" />
    <circle cx={-8} cy={-98} r={4} fill="#ff3a4a" opacity={0.7 + 0.3 * Math.sin(frame)} />
    <circle cx={8} cy={-98} r={4} fill="#ff3a4a" opacity={0.7 + 0.3 * Math.sin(frame)} />
  </g>
);

const Rays: React.FC<{ cx: number; cy: number; frame: number; color: string; opacity: number; count?: number }> = ({
  cx,
  cy,
  frame,
  color,
  opacity,
  count = 16,
}) => (
  <g opacity={opacity}>
    {Array.from({ length: count }).map((_, i) => {
      const a = (i / count) * Math.PI * 2 + frame * 0.01;
      const w = 0.07;
      return (
        <path
          key={i}
          d={`M ${cx} ${cy} L ${cx + Math.cos(a - w) * 2200} ${cy + Math.sin(a - w) * 2200} L ${cx + Math.cos(a + w) * 2200} ${cy + Math.sin(a + w) * 2200} Z`}
          fill={color}
        />
      );
    })}
  </g>
);

const Pellets: React.FC<{ from: [number, number]; angle: number; t: number; range: number; color?: string }> = ({
  from,
  angle,
  t,
  range,
  color = "#ffe14a",
}) => {
  if (t < 0 || t > 1) return null;
  return (
    <g>
      {Array.from({ length: 5 }).map((_, i) => {
        const a = ((angle + (i - 2) * 5) * Math.PI) / 180;
        const d = range * t;
        const x = from[0] + Math.cos(a) * d;
        const y = from[1] + Math.sin(a) * d;
        return (
          <g key={i}>
            <line x1={x - Math.cos(a) * 60} y1={y - Math.sin(a) * 60} x2={x} y2={y} stroke={color} strokeWidth={8} strokeLinecap="round" opacity={0.7} />
            <circle cx={x} cy={y} r={8} fill="#fff7c0" />
          </g>
        );
      })}
    </g>
  );
};

export const FantasyLegends: React.FC<{ frame: number }> = ({ frame }) => {
  const lf = frame - 360;
  return (
    <AbsoluteFill>
      {lf < 20 ? <BeatCover lf={lf} /> : lf < 36 ? <BeatLeap lf={lf - 20} /> : <BeatSunset lf={lf - 36} />}
      <DreamFrame warmth={0.22} />
      {/* quick warm flash on each cut */}
      <AbsoluteFill
        style={{
          background: "#fff2c0",
          opacity: Math.max(lerp(lf, [0, 4], [0.8, 0]), lf >= 20 ? lerp(lf, [20, 24], [0.7, 0]) : 0, lf >= 36 ? lerp(lf, [36, 41], [0.7, 0]) : 0),
        }}
      />
    </AbsoluteFill>
  );
};

// Beat 1: Shelly fires while El Primo shields her with his chest.
const BeatCover: React.FC<{ lf: number }> = ({ lf }) => {
  const S = 2.5;
  const gy = 900;
  const sx = 560;
  const px = 930;
  const shots = [1, 7, 13];
  const recoil = Math.max(...shots.map((s) => (lf >= s && lf < s + 5 ? 1 - (lf - s) / 5 : 0)));
  const muzzle = localToScreen([-7, 56, 66], 62);
  const m: [number, number] = [sx + muzzle[0] * S, gy + muzzle[1] * S - 30];
  const push = lf * 4;
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080}>
        <defs>
          <linearGradient id="heroSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ff7a3a" />
            <stop offset="0.6" stopColor="#ffb44a" />
            <stop offset="1" stopColor="#ffe08a" />
          </linearGradient>
        </defs>
        <rect width={1920} height={1080} fill="url(#heroSky)" />
        <Rays cx={1500} cy={560} frame={lf} color="#fff2b0" opacity={0.35} />
        <path d="M 0 700 L 200 610 L 420 640 L 640 560 L 900 620 L 1200 540 L 1500 600 L 1920 560 L 1920 1080 L 0 1080 Z" fill="#d9763a" />
        <path d="M 0 820 L 1920 800 L 1920 1080 L 0 1080 Z" fill="#f0a060" />
        {[0, 1, 2].map((i) => (
          <SilEnemy key={i} x={1480 + i * 140} y={850 - (i % 2) * 40} s={1.4} knock={clamp01((lf - (shots[i] + 5)) / 8)} frame={lf} />
        ))}
        {/* incoming enemy bullets bouncing off El Primo */}
        {[0, 1, 2, 3].map((i) => {
          const t0 = i * 4;
          const k = (lf - t0) / 6;
          if (k < 0 || k > 1.6) return null;
          const hitX = px + 70;
          const hitY = gy - 230 - i * 18;
          const x = k <= 1 ? 1500 - (1500 - hitX) * k : hitX + (k - 1) * 200;
          const y = k <= 1 ? hitY : hitY - (k - 1) * 260;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r={9} fill="#ff4a6a" />
              {k > 0.9 && k < 1.3 ? <Sparkle x={hitX} y={hitY} s={1.6} color="#fff" rot={lf * 20} /> : null}
            </g>
          );
        })}
        <g transform={`translate(${sx - push * 0.2} ${gy}) scale(${S})`}>
          <Shelly uid="fc1-s" phi={62} t={FT} v={FV} gun="aim" recoil={recoil} expr={{ eyes: "open", mouth: "smile" }} shadow={false} />
        </g>
        {shots.map((s, i) => (
          <Pellets key={i} from={m} angle={-4} t={(lf - s) / 6} range={1000} />
        ))}
        <g transform={`translate(${px} ${gy}) scale(${S * 1.05})`}>
          <ElPrimo uid="fc1-p" phi={50} t={FT} v={FV} arms={PRIMO_POSES.shield} expr={{ eyes: "open", mouth: "grin", brow: 1 }} shadow={false} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// Beat 2: El Primo's flaming leap while Shelly covers him.
const BeatLeap: React.FC<{ lf: number }> = ({ lf }) => {
  const S = 2.2;
  const t = clamp01(lf / 14);
  const x = 420 + t * 1000;
  const y = 880 - Math.sin(t * Math.PI) * 360 + (t > 0.85 ? (t - 0.85) * 400 : 0);
  const impact = lf >= 14 ? clamp01((lf - 14) / 6) : 0;
  return (
    <AbsoluteFill>
      <svg width={1920} height={1080}>
        <rect width={1920} height={1080} fill="#ff9a3a" />
        <Rays cx={1420} cy={820} frame={lf * 4} color="#ffe08a" opacity={0.5} count={22} />
        <path d="M 0 860 L 1920 820 L 1920 1080 L 0 1080 Z" fill="#e8823e" />
        {/* flame trail */}
        {Array.from({ length: 10 }).map((_, i) => {
          const tt = clamp01(t - i * 0.035);
          const tx = 420 + tt * 1000;
          const ty = 880 - Math.sin(tt * Math.PI) * 360 - 120;
          return <circle key={i} cx={tx} cy={ty} r={60 - i * 5} fill={i < 4 ? "#ffe14a" : "#ff6a2a"} opacity={(0.7 - i * 0.06) * (1 - impact)} />;
        })}
        {[0, 1, 2].map((i) => (
          <SilEnemy key={i} x={1360 + i * 120} y={840} s={1.3} knock={impact} frame={lf} />
        ))}
        {impact > 0 ? (
          <g opacity={1 - impact}>
            <circle cx={1420} cy={820} r={80 + impact * 400} fill="none" stroke="#fff6c0" strokeWidth={30 * (1 - impact)} />
            <circle cx={1420} cy={820} r={60 + impact * 160} fill="#fff2a0" opacity={0.7} />
          </g>
        ) : null}
        <g transform={`translate(${x} ${y}) scale(${S}) rotate(${(t - 0.5) * 30})`}>
          <ElPrimo uid="fc2-p" phi={70} t={FT} v={FV} arms={PRIMO_POSES.cheer} expr={{ eyes: "wide", mouth: "grin", brow: 1 }} shadow={false} walk={2} walkAmt={1} />
        </g>
        <g transform="translate(300 1060) scale(2.8)">
          <Shelly uid="fc2-s" phi={60} t={FT} v={FV} gun="aim" recoil={lf % 6 < 3 ? 1 : 0} expr={{ eyes: "open", mouth: "smile" }} shadow={false} />
        </g>
        <Pellets from={[470, 830]} angle={-28} t={(lf % 7) / 6} range={900} />
      </svg>
    </AbsoluteFill>
  );
};

// Beat 3: sunset silhouettes; they turn to each other and reach for a high-five.
const BeatSunset: React.FC<{ lf: number }> = ({ lf }) => {
  // lf 0..23 (frames 396-419)
  const S = 2.4;
  const gy = 930;
  const push = 1 + lf * 0.004;
  const turn = clamp01((lf - 8) / 6);
  const raise = clamp01((lf - 11) / 9);
  const xp = track(lf, [
    [0, 740],
    [23, 790],
  ]);
  const primoArms = blendArms(PRIMO_POSES.idle, { l: [44, 14, 54], r: [-30, 62, 140] }, raise);
  const shellyHand: V3 = [-24 - raise * 10, 6 + raise * 52, 40 + raise * 104];
  // place Shelly so their raised hands end ~20 px apart
  const phEnd = localToScreen([-30, 62, 140], 180 - 105);
  const shEnd = localToScreen([-34, 58, 144], 180 + 105);
  const xs = xp + phEnd[0] * S - shEnd[0] * S + 20 + (1 - raise) * 70;
  const sil = lerp(lf, [6, 16], [1, 0.45]);
  const ph = localToScreen(primoArms.r, 180 - 105 * turn);
  const sh = localToScreen(shellyHand, 180 + 105 * turn);
  const gx = (xp + ph[0] * S + xs + sh[0] * S) / 2;
  const gyy = (gy + ph[1] * S + gy + sh[1] * S) / 2;
  const glow = clamp01((lf - 14) / 9);
  const primoPhi = 180 - 105 * turn;
  const shellyPhi = 180 + 105 * turn;
  return (
    <AbsoluteFill style={{ scale: String(push) }}>
      <svg width={1920} height={1080}>
        <defs>
          <linearGradient id="sunsetSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#4a2a8a" />
            <stop offset="0.35" stopColor="#d24a7a" />
            <stop offset="0.65" stopColor="#ff8a3a" />
            <stop offset="1" stopColor="#ffd06a" />
          </linearGradient>
          <radialGradient id="sunDisk" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#fffbe0" />
            <stop offset="0.6" stopColor="#ffe08a" />
            <stop offset="1" stopColor="#ffb04a" />
          </radialGradient>
        </defs>
        <rect width={1920} height={1080} fill="url(#sunsetSky)" />
        <Rays cx={960} cy={700} frame={lf} color="#ffe6a0" opacity={0.28} count={20} />
        <circle cx={960} cy={700} r={420} fill="#ffcf6a" opacity={0.35} />
        <circle cx={960} cy={700} r={300} fill="url(#sunDisk)" />
        {Array.from({ length: 6 }).map((_, i) => (
          <rect key={i} x={0} y={720 + i * 26} width={1920} height={8} fill="#ff9a4a" opacity={0.35} />
        ))}
        {/* distant mesas */}
        <path d="M 0 820 L 120 760 L 340 760 L 400 800 L 1500 800 L 1560 740 L 1800 740 L 1920 790 L 1920 1080 L 0 1080 Z" fill="#7a2a4a" />
        {/* our cliff */}
        <path d="M 360 1080 L 420 940 L 600 920 L 1400 920 L 1560 950 L 1620 1080 Z" fill="#3a1430" />
        {/* birds */}
        {[0, 1, 2].map((i) => (
          <path
            key={i}
            d={`M ${1300 + i * 70 - lf * 3} ${300 + i * 30} q 12 -10 24 0 q 12 -10 24 0`}
            stroke="#3a1430"
            strokeWidth={4}
            fill="none"
          />
        ))}
        {/* characters: colored under a backlit silhouette layer */}
        {[false, true].map((silOn) => (
          <g key={String(silOn)} opacity={silOn ? sil : 1}>
            <g transform={`translate(${xs} ${gy}) scale(${S})`}>
              <Shelly
                uid={silOn ? "fc3-ss" : "fc3-s"}
                phi={shellyPhi}
                t={FT}
                v={FV}
                gun="back"
                arms={{ l: [26, 6, 40], r: shellyHand }}
                expr={{ eyes: lf > 16 ? "happy" : "open", mouth: "smile" }}
                silhouette={silOn ? "#2a1028" : undefined}
                shadow={false}
              />
            </g>
            <g transform={`translate(${xp} ${gy}) scale(${S * 1.02})`}>
              <ElPrimo
                uid={silOn ? "fc3-ps" : "fc3-p"}
                phi={primoPhi}
                t={FT}
                v={FV}
                arms={primoArms}
                expr={{ eyes: "happy", mouth: "grin" }}
                silhouette={silOn ? "#2a1028" : undefined}
                shadow={false}
              />
            </g>
          </g>
        ))}
        {/* the almost-touch glow between their hands */}
        {glow > 0 ? (
          <g>
            <circle cx={gx} cy={gyy} r={30 + glow * 60} fill="#fff6c8" opacity={0.35 * glow} />
            <circle cx={gx} cy={gyy} r={10 + glow * 18} fill="#ffffff" opacity={0.8 * glow} />
            {Array.from({ length: 8 }).map((_, i) => (
              <Sparkle key={i} x={gx + Math.cos(i + lf / 3) * (40 + glow * 50)} y={gyy + Math.sin(i * 1.3 + lf / 3) * (30 + glow * 40)} s={0.5 + rand(i) * 0.5} rot={lf * 9} />
            ))}
          </g>
        ) : null}
      </svg>
    </AbsoluteFill>
  );
};
