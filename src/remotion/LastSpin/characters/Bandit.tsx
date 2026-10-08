import React from "react";
import { CHAR_T, CHAR_V, GROUND_T } from "../engine/math";
import {
  ball,
  band,
  elbow,
  facing,
  limb,
  makeView,
  Part,
  project,
  renderParts,
  segment,
  Shadow,
  sph,
  V3,
} from "../engine/rig";

// Original rival brawler for the opening skirmish (not a Supercell design):
// a lanky desert bandit with a wide hat, red bandana and a long revolver.

const C = {
  coat: "#5f7a8c",
  skin: "#c98a5a",
  hat: "#6b4426",
  band: "#c83a2a",
  pants: "#3d3a4a",
  boot: "#2e2420",
  metal: "#9aa3ad",
};

export const Bandit: React.FC<{
  uid: string;
  phi: number;
  walk?: number;
  walkAmt?: number;
  recoil?: number;
  silhouette?: string;
}> = ({ uid, phi, walk = 0, walkAmt = 0, recoil = 0, silhouette }) => {
  const view = makeView(uid, phi, CHAR_T, CHAR_V, silhouette);
  const parts: Part[] = [];
  const stride = Math.sin(walk) * 14 * walkAmt;
  const bz = Math.abs(Math.sin(walk)) * 3 * walkAmt;
  ([-1, 1] as const).forEach((side) => {
    const s = side === 1 ? stride : -stride;
    parts.push(limb(view, `l${side}`, [side * 10, 0, 34 + bz], [side * 11, s, 5], 12, C.pants, -100));
    parts.push(ball(view, `f${side}`, [side * 11, s + 4, 5], 7, C.boot, -99));
  });
  parts.push(
    segment(
      view,
      `${uid}body`,
      28 + bz,
      74 + bz,
      18,
      14,
      20,
      14,
      C.coat,
      0,
      <g transform={`translate(0 ${-bz * CHAR_V})`}>
        {band(view, "belt", 36, 42, 18, 14, "#3a2416")}
        {band(view, "scarf", 66, 76, 19, 14, C.band)}
      </g>,
    ),
  );
  // gun arm (right) extended forward, left arm relaxed
  const sh: V3 = [-20, 0, 68 + bz];
  const hand: V3 = [-8, 44 - recoil * 8, 70 + bz + recoil * 6];
  const el = elbow(sh, hand, -1, 6, 4);
  const tip: V3 = [-8, 74 - recoil * 8, 74 + bz + recoil * 8];
  const ph = project(view, hand);
  parts.push({
    d: ph.d,
    el: (
      <g key="gunarm">
        {limb(view, "ua", sh, el, 11, C.coat).el}
        {limb(view, "fa", el, hand, 10, C.coat).el}
        {limb(view, "gun", hand, tip, 7, C.metal).el}
        {ball(view, "h", hand, 6.5, C.skin).el}
      </g>
    ),
  });
  const shL: V3 = [20, 0, 68 + bz];
  const hL: V3 = [24, 8 - stride * 0.6, 40 + bz];
  parts.push({
    d: project(view, hL).d,
    el: (
      <g key="larm">
        {limb(view, "lu", shL, elbow(shL, hL, 1, 5, 4), 11, C.coat).el}
        {limb(view, "lf", elbow(shL, hL, 1, 5, 4), hL, 10, C.coat).el}
        {ball(view, "lh", hL, 6.5, C.skin).el}
      </g>
    ),
  });
  // head with bandana mask and wide-brim hat
  const hc: V3 = [0, 2, 92 + bz];
  const hp = project(view, hc);
  const decals: React.ReactNode[] = [];
  if (!silhouette) {
    if (facing(view, 0, -20) > 0) {
      const pm = project(view, sph(hc, 20, 0, -22));
      const fx = Math.max(0.2, Math.cos((phi * Math.PI) / 180));
      decals.push(<ellipse key="mask" cx={pm.x} cy={pm.y + 3} rx={18 * fx} ry={9} fill={C.band} />);
      ([-1, 1] as const).forEach((s) => {
        if (facing(view, s * 22, 4) <= 0.1) return;
        const pe = project(view, sph(hc, 20, s * 22, 4));
        decals.push(<ellipse key={`e${s}`} cx={pe.x} cy={pe.y} rx={3 * fx + 0.5} ry={4} fill="#1a1a1a" />);
        decals.push(
          <line key={`b${s}`} x1={pe.x - 5 * fx} y1={pe.y - 7 + s * 2} x2={pe.x + 5 * fx} y2={pe.y - 7 - s * 2} stroke="#1a1a1a" strokeWidth={2.5} strokeLinecap="round" />,
        );
      });
    }
  }
  const brim = project(view, [0, 2, 104 + bz]);
  parts.push({
    d: hp.d + 3,
    el: (
      <g key="head">
        {ball(view, "skull", hc, 20, C.skin).el}
        <g>{decals}</g>
        <ellipse cx={brim.x} cy={brim.y} rx={34} ry={34 * CHAR_T} fill={silhouette ?? C.hat} stroke="#2b1608" strokeWidth={3} />
        <path
          d={`M ${brim.x - 16} ${brim.y} Q ${brim.x - 16} ${brim.y - 26} ${brim.x} ${brim.y - 26} Q ${brim.x + 16} ${brim.y - 26} ${brim.x + 16} ${brim.y} Z`}
          fill={silhouette ?? C.hat}
          stroke="#2b1608"
          strokeWidth={3}
        />
        {silhouette ? null : <rect x={brim.x - 16} y={brim.y - 9} width={32} height={6} fill={C.band} />}
      </g>
    ),
  });
  return (
    <g>
      <Shadow r={28} t={GROUND_T} />
      {renderParts(parts)}
    </g>
  );
};
