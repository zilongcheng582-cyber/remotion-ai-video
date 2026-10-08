import React from "react";
import { CHAR_T, CHAR_V, GROUND_T, shade } from "../engine/math";
import {
  ball,
  band,
  elbow,
  facing,
  limb,
  makeView,
  mixV,
  Part,
  project,
  renderParts,
  segment,
  Shadow,
  sph,
  surf,
  V3,
  View,
} from "../engine/rig";

// Original illustrated El Primo-inspired luchador rig (fan art; no official
// assets), styled after the user-supplied reference: blue luchador mask with
// red-rimmed eyes and a forehead flame, toothy grin, bare torso, red title belt
// with a star buckle, blue wristbands, tights and boots.

// Palette sampled from the user-supplied El Primo reference (image A).
export const PRIMO = {
  skin: "#e8904c",
  mask: "#2f7be6",
  maskDark: "#1c55b8",
  eyeRim: "#e2283c",
  flame: "#ff9a1e",
  belt: "#b33a32",
  gold: "#f7b52d",
  tights: "#2f6fe0",
  boot: "#2a5cc8",
  band: "#2f72e4",
};

export type PrimoArms = { l: V3; r: V3 };

export const PRIMO_POSES: Record<string, PrimoArms> = {
  idle: { l: [44, 14, 50], r: [-44, 14, 50] },
  guard: { l: [24, 40, 92], r: [-24, 40, 92] },
  spin: { l: [78, -6, 96], r: [-78, -6, 96] },
  cheer: { l: [52, 8, 150], r: [-52, 8, 150] },
  highFive: { l: [44, 14, 54], r: [-30, 34, 156] },
  flinch: { l: [30, 30, 100], r: [-30, 30, 100] },
  hug: { l: [30, 46, 84], r: [-30, 46, 84] },
  shield: { l: [58, 24, 116], r: [-58, 24, 116] },
  slump: { l: [36, 10, 40], r: [-36, 10, 40] },
};

export const blendArms = (a: PrimoArms, b: PrimoArms, t: number): PrimoArms => ({
  l: mixV(a.l, b.l, t),
  r: mixV(a.r, b.r, t),
});

export type PrimoExpr = {
  eyes?: "open" | "wide" | "happy" | "sad" | "closed";
  mouth?: "grin" | "open" | "o" | "flat" | "frown" | "smile";
  look?: [number, number]; // pupil offset -1..1
  brow?: number; // -1 worried .. 1 determined
};

export type PrimoProps = {
  uid: string;
  phi: number;
  t?: number;
  v?: number;
  arms?: PrimoArms;
  walk?: number; // phase in radians
  walkAmt?: number;
  bob?: number; // vertical body offset
  expr?: PrimoExpr;
  silhouette?: string;
  shadow?: boolean;
  headTurn?: number;
};

const HEAD_C: V3 = [0, 6, 120];
const HEAD_R = 27;

const starPath = (cx: number, cy: number, r0: number, r1: number, fx: number) => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? r0 : r1;
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    pts.push(`${cx + Math.cos(a) * r * fx} ${cy + Math.sin(a) * r}`);
  }
  return `M ${pts.join(" L ")} Z`;
};

const headDecals = (view: View, expr: PrimoExpr): React.ReactNode[] => {
  if (view.silhouette) return [];
  const out: React.ReactNode[] = [];
  const eyes = expr.eyes ?? "open";
  const look = expr.look ?? [0, 0];
  const brow = expr.brow ?? 0;
  const vis = (a: number, e: number) => facing(view, a, e);
  const fx = (a: number) => Math.max(0, Math.cos(((a - view.phi) * Math.PI) / 180));
  const at = (a: number, e: number, r = HEAD_R) => project(view, sph(HEAD_C, r, a, e));

  // Back lacing of the mask (visible when facing away).
  for (let i = 0; i < 4; i++) {
    const e = 30 - i * 14;
    if (vis(180, e) > 0.1) {
      const p = at(180, e);
      out.push(
        <path
          key={`lace${i}`}
          d={`M ${p.x - 6} ${p.y - 3} L ${p.x + 6} ${p.y + 3} M ${p.x + 6} ${p.y - 3} L ${p.x - 6} ${p.y + 3}`}
          stroke="#f4f0e0"
          strokeWidth={2.5}
          strokeLinecap="round"
        />,
      );
    }
  }
  // Lower face: the mask stops above the mouth (reference: big toothy grin).
  if (vis(0, -34) > -0.1) {
    const p = at(0, -34);
    const f = Math.max(0.15, fx(0));
    out.push(<ellipse key="jaw" cx={p.x} cy={p.y + 3} rx={21 * f} ry={14} fill={PRIMO.skin} />);
    out.push(
      <path
        key="nose"
        d={`M ${p.x - 3 * f} ${p.y - 10} Q ${p.x} ${p.y - 6} ${p.x + 3 * f} ${p.y - 10}`}
        stroke={shade(PRIMO.skin, -0.35)}
        strokeWidth={2}
        fill="none"
      />,
    );
    const mouth = expr.mouth ?? "flat";
    const w = 13 * f;
    const mx = p.x;
    const my = p.y + 2;
    let m: React.ReactNode;
    if (mouth === "grin" || mouth === "smile") {
      const h = mouth === "grin" ? 11 : 7;
      m = (
        <g>
          <path
            d={`M ${mx - w} ${my - h / 2} Q ${mx} ${my - h / 2 - 3} ${mx + w} ${my - h / 2} Q ${mx + w + 1} ${my + h / 2 + 2} ${mx} ${my + h / 2 + 3} Q ${mx - w - 1} ${my + h / 2 + 2} ${mx - w} ${my - h / 2} Z`}
            fill="#fffaf0"
            stroke="#2b1608"
            strokeWidth={2}
          />
          <line x1={mx - w} y1={my + 0.5} x2={mx + w} y2={my + 0.5} stroke="#2b1608" strokeWidth={1.2} />
          {[-0.5, 0, 0.5].map((k) => (
            <line key={k} x1={mx + k * w} y1={my - h / 2 - 1} x2={mx + k * w} y2={my + h / 2 + 2} stroke="#2b1608" strokeWidth={1.2} />
          ))}
        </g>
      );
    } else if (mouth === "open") {
      m = (
        <g>
          <ellipse cx={mx} cy={my + 2} rx={w * 0.7} ry={7} fill="#5a1414" stroke="#2b1608" strokeWidth={1.5} />
          <rect x={mx - w * 0.5} y={my - 4} width={w} height={4} rx={1} fill="#fffaf0" />
        </g>
      );
    } else if (mouth === "o") {
      m = <ellipse cx={mx} cy={my + 2} rx={w * 0.32} ry={5} fill="#5a1414" stroke="#2b1608" strokeWidth={1.5} />;
    } else if (mouth === "frown") {
      m = (
        <path
          d={`M ${mx - w * 0.6} ${my + 4} Q ${mx} ${my - 3} ${mx + w * 0.6} ${my + 4}`}
          fill="none"
          stroke="#2b1608"
          strokeWidth={2.6}
          strokeLinecap="round"
        />
      );
    } else {
      m = (
        <line x1={mx - w * 0.45} y1={my + 1} x2={mx + w * 0.45} y2={my + 1} stroke="#2b1608" strokeWidth={2.6} strokeLinecap="round" />
      );
    }
    out.push(<g key="mouth">{m}</g>);
  }
  // Forehead flame emblem.
  if (vis(0, 44) > 0.05) {
    const p = at(0, 44);
    const f = Math.max(0.2, fx(0));
    out.push(
      <path
        key="flame"
        d={`M ${p.x} ${p.y + 7} Q ${p.x - 8 * f} ${p.y + 4} ${p.x - 5 * f} ${p.y - 3} Q ${p.x - 2 * f} ${p.y} ${p.x - 1 * f} ${p.y - 4}
            Q ${p.x} ${p.y - 9} ${p.x + 3 * f} ${p.y - 11} Q ${p.x + 2 * f} ${p.y - 5} ${p.x + 6 * f} ${p.y - 3} Q ${p.x + 8 * f} ${p.y + 4} ${p.x} ${p.y + 7} Z`}
        fill={PRIMO.flame}
        stroke="#c4560a"
        strokeWidth={1.2}
      />,
    );
    out.push(<ellipse key="flame2" cx={p.x} cy={p.y + 2} rx={2.5 * f} ry={3} fill="#ffe06a" />);
  }
  // Eye holes: white with a thick red rim.
  ([-1, 1] as const).forEach((side) => {
    const a = side * 30;
    if (vis(a, 8) <= 0.05) return;
    const f = Math.max(0.15, fx(a));
    const p = at(a, 8);
    const k = `eye${side}`;
    const open = eyes === "wide" ? 1.15 : eyes === "sad" ? 0.85 : 1;
    const tilt = side * 12;
    out.push(
      <ellipse
        key={`${k}r`}
        cx={p.x}
        cy={p.y}
        rx={11.5 * f * open}
        ry={10.5 * open}
        fill={PRIMO.eyeRim}
        transform={`rotate(${tilt} ${p.x} ${p.y})`}
      />,
    );
    if (eyes === "happy" || eyes === "closed") {
      out.push(<ellipse key={`${k}w`} cx={p.x} cy={p.y} rx={8 * f} ry={7.5} fill="#fff" transform={`rotate(${tilt} ${p.x} ${p.y})`} />);
      out.push(
        <path
          key={`${k}h`}
          d={
            eyes === "happy"
              ? `M ${p.x - 6 * f} ${p.y + 2} Q ${p.x} ${p.y - 6} ${p.x + 6 * f} ${p.y + 2}`
              : `M ${p.x - 6 * f} ${p.y} Q ${p.x} ${p.y + 4} ${p.x + 6 * f} ${p.y}`
          }
          stroke="#1a1a2e"
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
        />,
      );
    } else {
      out.push(
        <ellipse
          key={`${k}w`}
          cx={p.x}
          cy={p.y}
          rx={8 * f * open}
          ry={7.5 * open}
          fill="#fff"
          transform={`rotate(${tilt} ${p.x} ${p.y})`}
        />,
      );
      out.push(
        <circle
          key={`${k}p`}
          cx={p.x + look[0] * 3 * f}
          cy={p.y + look[1] * 3}
          r={eyes === "wide" ? 1.8 : eyes === "sad" ? 3.2 : 2.6}
          fill="#1a1a2e"
        />,
      );
    }
    if (brow !== 0 || eyes === "sad") {
      const bt = (eyes === "sad" ? -1 : brow) * 4 * side;
      out.push(
        <path
          key={`${k}b`}
          d={`M ${p.x - 9 * f} ${p.y - 13 - bt} L ${p.x + 9 * f} ${p.y - 13 + bt}`}
          stroke={PRIMO.maskDark}
          strokeWidth={3.5}
          strokeLinecap="round"
        />,
      );
    }
  });
  return out;
};

const torsoDecals = (view: View): React.ReactNode[] => {
  if (view.silhouette) return [];
  const out: React.ReactNode[] = [];
  const line = shade(PRIMO.skin, -0.32);
  ([-1, 1] as const).forEach((side) => {
    const a = side * 28;
    if (facing(view, a) <= 0.05) return;
    const p = project(view, surf(a, 92, 40, 25));
    const fx = Math.max(0.15, Math.cos(((a - view.phi) * Math.PI) / 180));
    out.push(
      <path
        key={`pec${side}`}
        d={`M ${p.x - 15 * fx} ${p.y - 4} Q ${p.x} ${p.y + 10} ${p.x + 15 * fx} ${p.y - 3}`}
        stroke={line}
        strokeWidth={2.2}
        fill="none"
        strokeLinecap="round"
      />,
    );
  });
  if (facing(view, 0) > 0.1) {
    const fx = Math.max(0.15, Math.cos((view.phi * Math.PI) / 180));
    const top = project(view, surf(0, 92, 36, 26));
    const bot = project(view, surf(0, 66, 32, 24));
    const mid = project(view, surf(0, 76, 33, 24));
    out.push(
      <path
        key="cross"
        d={`M ${top.x} ${top.y} L ${bot.x} ${bot.y} M ${mid.x - 7 * fx} ${mid.y} L ${mid.x + 7 * fx} ${mid.y}`}
        stroke={line}
        strokeWidth={2.4}
        strokeLinecap="round"
      />,
    );
  }
  return out;
};

export const ElPrimo: React.FC<PrimoProps> = ({
  uid,
  phi,
  t = CHAR_T,
  v = CHAR_V,
  arms = PRIMO_POSES.idle,
  walk = 0,
  walkAmt = 0,
  bob = 0,
  expr = {},
  silhouette,
  shadow = true,
  headTurn = 0,
}) => {
  const view = makeView(uid, phi, t, v, silhouette);
  const headView = makeView(uid + "h", phi + headTurn, t, v, silhouette);
  const parts: Part[] = [];
  const stride = Math.sin(walk) * 16 * walkAmt;
  const lift = Math.abs(Math.cos(walk)) * 6 * walkAmt;
  const bz = bob + Math.abs(Math.sin(walk)) * 3 * walkAmt;

  // Legs
  ([-1, 1] as const).forEach((side) => {
    const s = side === 1 ? stride : -stride;
    const hip: V3 = [side * 17, 0, 40 + bz];
    const knee: V3 = [side * 19, s * 0.5 + 4, 22 + bz * 0.5];
    const foot: V3 = [side * 19, s, 6 + (s > 0 ? lift : 0)];
    parts.push(limb(view, `thigh${side}`, hip, knee, 23, PRIMO.tights, -100));
    parts.push(limb(view, `boot${side}`, mixV(knee, foot, 0.2), foot, 24, PRIMO.boot, -99.5));
    parts.push(limb(view, `cuff${side}`, mixV(knee, foot, 0.2), mixV(knee, foot, 0.36), 27, PRIMO.boot, -99.4));
    parts.push(ball(view, `foot${side}`, [foot[0], foot[1] + 7, 7], 13, PRIMO.boot, -99));
  });

  // Torso: one tapered body with trunks and title belt painted as bands
  parts.push(
    segment(
      view,
      `${uid}body`,
      30 + bz,
      104 + bz,
      30,
      23,
      44,
      27,
      PRIMO.skin,
      0,
      <g transform={`translate(0 ${-bz * v})`}>
        {torsoDecals(view)}
        {band(view, "tights", 26, 54, 30, 23, PRIMO.tights)}
        {band(view, "belt", 52, 63, 31, 24, PRIMO.belt)}
      </g>,
    ),
  );
  // Belt plate
  if (!silhouette && facing(view, 0) > 0.05) {
    const p = project(view, surf(0, 57 + bz, 32, 25));
    const fx = Math.max(0.2, Math.cos((phi * Math.PI) / 180));
    parts.push({
      d: 0.35,
      el: (
        <g key="plate">
          <ellipse cx={p.x} cy={p.y} rx={13 * fx} ry={10} fill={PRIMO.gold} stroke="#8a4a00" strokeWidth={2} />
          <ellipse cx={p.x} cy={p.y} rx={9 * fx} ry={7} fill="#ff8a1e" />
          <path
            d={starPath(p.x, p.y, 6, 2.6, fx)}
            fill="#ffe06a"
          />
        </g>
      ),
    });
  }

  // Arms
  ([-1, 1] as const).forEach((side) => {
    const hand = side === 1 ? arms.l : arms.r;
    const h: V3 = [hand[0], hand[1], hand[2] + bz];
    const sh: V3 = [side * 44, 0, 96 + bz];
    const el = elbow(sh, h, side, 12, 10);
    const bias = 0.25;
    parts.push(ball(view, `delt${side}`, sh, 16, PRIMO.skin, 0.4));
    parts.push(limb(view, `upper${side}`, sh, el, 22, PRIMO.skin, bias));
    parts.push(limb(view, `fore${side}`, el, h, 21, PRIMO.skin, bias + 0.05));
    parts.push(limb(view, `band${side}`, mixV(el, h, 0.5), mixV(el, h, 0.86), 26, PRIMO.band, bias + 0.1));
    parts.push(ball(view, `fist${side}`, h, 14, PRIMO.skin, bias + 0.15));
  });

  // Head (always drawn above torso)
  const hc: V3 = [HEAD_C[0], HEAD_C[1], HEAD_C[2] + bz];
  const hp = project(headView, hc);
  const clipId = `pclip-${uid}`;
  parts.push({
    d: hp.d + 3,
    el: (
      <g key="head">
        {ball(headView, "skull", hc, HEAD_R, PRIMO.mask).el}
        {silhouette ? null : (
          <>
            <clipPath id={clipId}>
              <circle cx={hp.x} cy={hp.y} r={HEAD_R} />
            </clipPath>
            <g clipPath={`url(#${clipId})`} transform={`translate(0 ${-bz * v})`}>
              {headDecals(headView, expr)}
            </g>
          </>
        )}
      </g>
    ),
  });

  const sorted = renderParts(parts);

  return (
    <g>
      {shadow ? <Shadow r={46} t={GROUND_T} /> : null}
      {sorted}
    </g>
  );
};
