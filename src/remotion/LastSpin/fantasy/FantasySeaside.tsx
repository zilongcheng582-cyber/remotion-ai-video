import React from "react";
import { AbsoluteFill } from "remotion";
import { ElPrimo } from "../characters/ElPrimo";
import { Shelly } from "../characters/Shelly";
import { lerp, rand, track } from "../engine/math";
import { V3 } from "../engine/rig";
import { Bubbles, DreamFrame, FT, FV, Jellyfish, localToScreen, Net, Sparkle } from "./common";

// Fantasy A — "Best friends forever": an affectionate, original homage to the
// goofy undersea best-friendship of classic cartoons (flower-shaped clouds,
// jellyfish nets, a starfish in the sand) without reproducing any characters.

const S = 3; // character scale

const FlowerCloud: React.FC<{ x: number; y: number; s: number; color: string }> = ({ x, y, s, color }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={0.9}>
    {[0, 72, 144, 216, 288].map((a) => (
      <ellipse
        key={a}
        cx={Math.cos((a * Math.PI) / 180) * 26}
        cy={Math.sin((a * Math.PI) / 180) * 26}
        rx={26}
        ry={20}
        transform={`rotate(${a} ${Math.cos((a * Math.PI) / 180) * 26} ${Math.sin((a * Math.PI) / 180) * 26})`}
        fill={color}
      />
    ))}
    <circle r={18} fill="#ffffff" opacity={0.85} />
  </g>
);

const Starfish: React.FC<{ x: number; y: number; s: number; rot: number }> = ({ x, y, s, rot }) => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 40 : 17;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    pts.push(`${Math.cos(a) * r} ${Math.sin(a) * r}`);
  }
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s} ${s * 0.55})`}>
      <path d={`M ${pts.join(" L ")} Z`} fill="#ff8aa8" stroke="#a23a5a" strokeWidth={4} strokeLinejoin="round" />
      {[0, 1, 2, 3, 4].map((i) => (
        <circle key={i} cx={Math.cos((i / 5) * Math.PI * 2 - 1.57) * 22} cy={Math.sin((i / 5) * Math.PI * 2 - 1.57) * 22} r={3} fill="#ffd0dc" />
      ))}
    </g>
  );
};

export const FantasySeaside: React.FC<{ frame: number }> = ({ frame }) => {
  const lf = frame - 210;
  const scroll = lf * 7;
  // beats
  const jump = (t0: number, t1: number, h: number) =>
    lf > t0 && lf < t1 ? Math.sin(((lf - t0) / (t1 - t0)) * Math.PI) * h : 0;
  const hug = lerp(lf, [58, 66], [0, 1]);
  const primoX = track(lf, [
    [0, 640],
    [56, 780],
    [66, 820],
  ]);
  const shellyX = track(lf, [
    [0, 1060],
    [56, 1140],
    [66, 1010],
  ]);
  const groundY = 930;
  const skip = Math.abs(Math.sin(lf / 4.2)) * 26 * (1 - hug);
  const pz = skip + jump(30, 52, 150);
  const sz = Math.abs(Math.sin(lf / 4.2 + 1.2)) * 22 * (1 - hug) + jump(33, 54, 140) + hug * (40 + Math.sin(lf / 3) * 8);
  const primoPhi = 48;
  const shellyPhi = track(lf, [
    [0, 48],
    [56, 48],
    [64, -55],
  ]);

  // poses
  const netHand: V3 = lf < 30 ? [74, -14, 140 + Math.sin(lf / 4) * 8] : lf < 52 ? [70, 30, 136] : [70, 10, 136];
  const primoArms = hug > 0.5
    ? { l: [32, 50, 86] as V3, r: [-32, 50, 86] as V3 }
    : { l: netHand, r: [-44, 14 + Math.sin(lf / 4.2) * 24, 62] as V3 };
  const sNet: V3 = [44, -8, 116 + Math.sin(lf / 4 + 1) * 8];
  const shellyArms = hug > 0.5
    ? { l: [32, 10, 124] as V3, r: [-32, 10, 124] as V3 }
    : { l: sNet, r: [-26, 8 + Math.sin(lf / 4.2) * 18, 44] as V3 };

  const caught = lf >= 46;
  const pNetHand = localToScreen(primoArms.l, primoPhi);
  const sNetHand = localToScreen(shellyArms.l, shellyPhi);

  return (
    <AbsoluteFill>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <defs>
          <linearGradient id="seaSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3cc4f0" />
            <stop offset="0.6" stopColor="#9fe8ff" />
            <stop offset="1" stopColor="#e6fbff" />
          </linearGradient>
          <linearGradient id="seaWater" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1fb6c9" />
            <stop offset="1" stopColor="#6ee0d6" />
          </linearGradient>
          <linearGradient id="seaSand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffe6a6" />
            <stop offset="1" stopColor="#f5c46e" />
          </linearGradient>
        </defs>
        <rect width={1920} height={1080} fill="url(#seaSky)" />
        {/* sun glow */}
        <circle cx={1580} cy={170} r={150} fill="#fff7c2" opacity={0.6} />
        <circle cx={1580} cy={170} r={90} fill="#fffbe0" />
        {/* flower clouds, slow parallax */}
        {Array.from({ length: 9 }).map((_, i) => {
          const x = ((i * 280 - scroll * 0.25 + 4000) % 2400) - 200;
          const y = 90 + rand(i * 3) * 330;
          const cols = ["#ffd5ec", "#fff3b8", "#ffffff", "#d6f5ff", "#ffe0c2"];
          return <FlowerCloud key={i} x={x} y={y} s={0.7 + rand(i * 7) * 0.9} color={cols[i % 5]} />;
        })}
        {/* sea */}
        <rect y={560} width={1920} height={200} fill="url(#seaWater)" />
        {Array.from({ length: 12 }).map((_, i) => {
          const x = ((i * 190 - scroll * 0.5 + 4000) % 2280) - 180;
          return (
            <path
              key={i}
              d={`M ${x} ${600 + (i % 3) * 40} q 30 -14 60 0 t 60 0`}
              stroke="#e8ffff"
              strokeWidth={5}
              fill="none"
              strokeLinecap="round"
              opacity={0.7}
            />
          );
        })}
        {/* sand */}
        <path d={`M 0 760 Q 480 720 960 750 T 1920 740 L 1920 1080 L 0 1080 Z`} fill="url(#seaSand)" />
        <path d={`M 0 760 Q 480 720 960 750 T 1920 740`} stroke="#ffffff" strokeWidth={10} fill="none" opacity={0.7} />
        {Array.from({ length: 16 }).map((_, i) => {
          const x = ((i * 160 - scroll + 6000) % 2560) - 320;
          return <ellipse key={i} cx={x} cy={830 + (i % 4) * 60} rx={10 + (i % 3) * 6} ry={5} fill="#e8b25e" opacity={0.6} />;
        })}
        <Starfish x={((1500 - scroll) % 2600 + 2600) % 2600 - 300} y={1010} s={1.4} rot={-12} />
        <Starfish x={((400 - scroll) % 2600 + 2600) % 2600 - 300} y={980} s={0.9} rot={20} />
        {/* floating jellyfish */}
        {[0, 1, 2, 3].map((i) => {
          const x = ((i * 520 + 300 - scroll * 0.6 + 5000) % 2300) - 200;
          const y = 300 + Math.sin(lf / 9 + i * 2) * 30 + (i % 2) * 120;
          return (
            <g key={i} transform={`translate(${x} ${y})`}>
              <Jellyfish s={0.9 + (i % 2) * 0.3} frame={lf + i * 7} color={i % 2 ? "#ffa3d6" : "#ff8fc8"} />
            </g>
          );
        })}
        <Bubbles frame={lf} count={18} seed={4} />
        {/* characters */}
        <ellipse cx={shellyX} cy={groundY} rx={70 - sz * 0.15} ry={16} fill="#b07a3a" opacity={0.35} />
        <ellipse cx={primoX} cy={groundY} rx={110 - pz * 0.2} ry={22} fill="#b07a3a" opacity={0.35} />
        <g transform={`translate(${shellyX} ${groundY - sz}) scale(${S})`}>
          <Shelly
            uid="fa-s"
            phi={shellyPhi}
            t={FT}
            v={FV}
            gun="back"
            arms={shellyArms}
            walk={lf / 4.2}
            walkAmt={1 - hug}
            expr={{ eyes: "happy", mouth: "laugh" }}
            shadow={false}
          />
          {hug < 0.5 ? <Net hand={sNetHand} angle={18 + Math.sin(lf / 4) * 10} frame={lf} /> : null}
        </g>
        <g transform={`translate(${primoX} ${groundY - pz}) scale(${S})`}>
          <ElPrimo
            uid="fa-p"
            phi={primoPhi}
            t={FT}
            v={FV}
            arms={primoArms}
            walk={lf / 4.2}
            walkAmt={1 - hug}
            expr={{ eyes: "happy", mouth: "grin" }}
            shadow={false}
          />
          {hug < 0.5 ? (
            <Net hand={pNetHand} angle={lf < 30 ? 10 + Math.sin(lf / 4) * 12 : lf < 52 ? lerp(lf, [30, 46], [10, 70]) : 30} catchJelly={caught} frame={lf} />
          ) : null}
        </g>
        {/* the jellyfish they're chasing */}
        {!caught ? (
          <g transform={`translate(${lerp(lf, [0, 46], [1400, primoX + 230])} ${lerp(lf, [0, 46], [520, groundY - 460])})`}>
            <Jellyfish s={1.2} frame={lf} />
          </g>
        ) : null}
        {/* joy sparkles */}
        {lf >= 60
          ? Array.from({ length: 10 }).map((_, i) => {
              const t = lf - 60 - i * 1.5;
              if (t < 0) return null;
              return (
                <Sparkle
                  key={i}
                  x={900 + Math.cos(i * 1.7) * (120 + t * 6)}
                  y={560 + Math.sin(i * 1.7) * (90 + t * 4) - t * 3}
                  s={Math.max(0, 1.3 - t / 26)}
                  rot={t * 8}
                  color={i % 2 ? "#ffffff" : "#ffe76a"}
                />
              );
            })
          : null}
      </svg>
      <DreamFrame warmth={0.12} />
    </AbsoluteFill>
  );
};

