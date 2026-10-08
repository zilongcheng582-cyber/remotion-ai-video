import React from "react";
import { CHAR_T, CHAR_V, GROUND_T, shade } from "../engine/math";
import {
  addV,
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
  V3,
  View,
} from "../engine/rig";

// Original illustrated Shelly-inspired rig (fan art; no official assets),
// styled after the user-supplied reference: voluminous purple hair, purple
// brows, cheek band-aid, yellow bandana, lavender shirt, jeans with a yellow
// stripe, blue boots and a chunky silver shotgun with a wooden grip/forend.

export const SHELLY = {
  hair: "#a35ae2",
  hairLight: "#c88af7",
  hairDark: "#6a2fae",
  skin: "#d98d5f",
  shirt: "#cbb9f2",
  scarf: "#f6b62b",
  jeans: "#5a64cc",
  stripe: "#f2c230",
  boot: "#4d58bf",
  belt: "#5a3a8a",
  wood: "#a8562a",
  metal: "#a9b8d8",
  metalDark: "#7686ad",
};

export type ShellyGun = "aim" | "carry" | "back";

export type ShellyExpr = {
  eyes?: "calm" | "open" | "happy" | "closed";
  mouth?: "flat" | "smile" | "laugh";
  look?: [number, number];
};

export type ShellyProps = {
  uid: string;
  phi: number;
  t?: number;
  v?: number;
  gun?: ShellyGun;
  recoil?: number; // 0..1
  pump?: number; // 0..1 forend slide
  arms?: { l: V3; r: V3 }; // used when gun === "back"
  walk?: number;
  walkAmt?: number;
  bob?: number;
  lift?: number; // whole-body z offset (jumps, being lifted)
  expr?: ShellyExpr;
  silhouette?: string;
  shadow?: boolean;
  glow?: number; // Super-ready glow on the gun
};

const HEAD_C: V3 = [0, 3, 94];
const HEAD_R = 26;

export const SHELLY_ARMS: Record<string, { l: V3; r: V3 }> = {
  relaxed: { l: [26, 6, 40], r: [-26, 6, 40] },
  wave: { l: [26, 6, 40], r: [-34, 10, 118] },
  cheer: { l: [34, 6, 124], r: [-34, 6, 124] },
  highFive: { l: [26, 6, 40], r: [-24, 26, 128] },
};

const headDecals = (view: View, expr: ShellyExpr): React.ReactNode[] => {
  if (view.silhouette) return [];
  const out: React.ReactNode[] = [];
  const fx = (a: number) => Math.max(0, Math.cos(((a - view.phi) * Math.PI) / 180));
  const at = (a: number, e: number, r = HEAD_R) => project(view, sph(HEAD_C, r, a, e));
  if (facing(view, 0, -10) > -0.3) {
    const p = at(0, -14);
    const f = fx(0);
    out.push(<ellipse key="face" cx={p.x} cy={p.y + 3} rx={21 * Math.max(0.12, f)} ry={21} fill={SHELLY.skin} />);
    const eyes = expr.eyes ?? "calm";
    const look = expr.look ?? [0, 0];
    ([-1, 1] as const).forEach((side) => {
      const a = side * 22;
      if (facing(view, a, -8) <= 0.08) return;
      const pe = at(a, -8);
      const ef = Math.max(0.15, fx(a));
      const k = `e${side}`;
      // purple brow
      const pb = at(a, 12);
      out.push(
        <path
          key={`${k}br`}
          d={`M ${pb.x - 7 * ef} ${pb.y + (side === 1 ? 1 : -1)} Q ${pb.x} ${pb.y - 3} ${pb.x + 7 * ef} ${pb.y + (side === 1 ? -1 : 1)}`}
          stroke={SHELLY.hairDark}
          strokeWidth={4}
          strokeLinecap="round"
          fill="none"
        />,
      );
      if (eyes === "happy" || eyes === "closed") {
        out.push(
          <path
            key={k}
            d={
              eyes === "happy"
                ? `M ${pe.x - 6 * ef} ${pe.y + 2} Q ${pe.x} ${pe.y - 6} ${pe.x + 6 * ef} ${pe.y + 2}`
                : `M ${pe.x - 6 * ef} ${pe.y} Q ${pe.x} ${pe.y + 4} ${pe.x + 6 * ef} ${pe.y}`
            }
            stroke="#1e1020"
            strokeWidth={3.2}
            fill="none"
            strokeLinecap="round"
          />,
        );
        return;
      }
      out.push(<ellipse key={`${k}w`} cx={pe.x} cy={pe.y} rx={6.2 * ef} ry={7} fill="#fff" stroke="#1e1020" strokeWidth={1} />);
      out.push(
        <ellipse key={k} cx={pe.x + look[0] * 2 * ef + side * 0.6} cy={pe.y + 0.5 + look[1] * 1.5} rx={3.4 * ef} ry={4.6} fill="#1e1020" />,
      );
      out.push(<circle key={`${k}h`} cx={pe.x - 1 * ef + look[0] * 2 * ef} cy={pe.y - 1.5} r={1.2} fill="#fff" />);
      if (eyes === "calm") {
        // relaxed upper lid
        out.push(
          <path
            key={`${k}l`}
            d={`M ${pe.x - 7 * ef} ${pe.y - 2} Q ${pe.x} ${pe.y - 4.5} ${pe.x + 7 * ef} ${pe.y - 2} L ${pe.x + 7 * ef} ${pe.y - 9} L ${pe.x - 7 * ef} ${pe.y - 9} Z`}
            fill={SHELLY.skin}
          />,
        );
        out.push(
          <path
            key={`${k}ll`}
            d={`M ${pe.x - 7 * ef} ${pe.y - 2} Q ${pe.x} ${pe.y - 4.5} ${pe.x + 7 * ef} ${pe.y - 2}`}
            stroke="#1e1020"
            strokeWidth={2}
            fill="none"
          />,
        );
      }
    });
    // band-aid on her left cheek (screen right when facing camera)
    if (facing(view, -32, -22) > 0.1) {
      const pc = at(-32, -22);
      const cf = Math.max(0.2, fx(-32));
      out.push(
        <rect
          key="bandaid"
          x={pc.x - 4.5 * cf}
          y={pc.y - 3.5}
          width={9 * cf}
          height={7}
          rx={2}
          fill="#f6dcc0"
          stroke="#b98a68"
          strokeWidth={0.8}
          transform={`rotate(-20 ${pc.x} ${pc.y})`}
        />,
      );
    }
    if (facing(view, 0, -32) > 0.08) {
      const pm = at(0, -34);
      const w = 6 * Math.max(0.2, f);
      const mouth = expr.mouth ?? "flat";
      out.push(
        mouth === "laugh" ? (
          <path key="m" d={`M ${pm.x - w} ${pm.y - 2} Q ${pm.x} ${pm.y + 8} ${pm.x + w} ${pm.y - 2} Z`} fill="#7a1f2a" />
        ) : mouth === "smile" ? (
          <path
            key="m"
            d={`M ${pm.x - w} ${pm.y - 1} Q ${pm.x} ${pm.y + 5} ${pm.x + w} ${pm.y - 1}`}
            stroke="#5a1a20"
            strokeWidth={2.2}
            fill="none"
            strokeLinecap="round"
          />
        ) : (
          <line key="m" x1={pm.x - w * 0.5} y1={pm.y + 1} x2={pm.x + w * 0.5} y2={pm.y + 1} stroke="#5a1a20" strokeWidth={2.2} strokeLinecap="round" />
        ),
      );
    }
  }
  // Big swept fringe over the forehead
  const pts: [number, number][] = [
    [-84, 12],
    [-58, 24],
    [-30, 18],
    [-4, 14],
    [20, 16],
    [44, 6],
    [62, -12],
    [80, 4],
    [70, 36],
    [0, 60],
    [-70, 40],
  ];
  let vis = 0;
  const bang = pts.map(([a, e], i) => {
    const p = at(a, e, HEAD_R + 1);
    if (facing(view, a, e) > -0.1) vis++;
    return `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`;
  });
  if (vis > 2) {
    out.push(
      <path key="bangs" d={bang.join(" ") + " Z"} fill={SHELLY.hair} stroke={SHELLY.hairDark} strokeWidth={2} strokeLinejoin="round" />,
    );
  }
  const sh = at(-25, 52);
  out.push(<ellipse key="shine" cx={sh.x} cy={sh.y} rx={10} ry={4} fill={SHELLY.hairLight} opacity={0.8} />);
  return out;
};

export const Shelly: React.FC<ShellyProps> = ({
  uid,
  phi,
  t = CHAR_T,
  v = CHAR_V,
  gun = "carry",
  recoil = 0,
  pump = 0,
  arms = SHELLY_ARMS.relaxed,
  walk = 0,
  walkAmt = 0,
  bob = 0,
  lift = 0,
  expr = {},
  silhouette,
  shadow = true,
  glow = 0,
}) => {
  const view = makeView(uid, phi, t, v, silhouette);
  const parts: Part[] = [];
  const stride = Math.sin(walk) * 12 * walkAmt;
  const footLift = Math.abs(Math.cos(walk)) * 5 * walkAmt;
  const bz = bob + lift + Math.abs(Math.sin(walk)) * 2.5 * walkAmt;

  // Legs: jeans with a yellow side stripe, blue boots
  ([-1, 1] as const).forEach((side) => {
    const s = side === 1 ? stride : -stride;
    const hip: V3 = [side * 10, 0, 30 + bz];
    const knee: V3 = [side * 11, s * 0.5 + 3, 16 + bz * 0.6];
    const foot: V3 = [side * 11, s, 5 + lift + (s > 0 ? footLift : 0)];
    parts.push(limb(view, `th${side}`, hip, mixV(knee, foot, 0.3), 15, SHELLY.jeans, -100));
    parts.push(limb(view, `st${side}`, [hip[0] + side * 6, hip[1], hip[2]], [knee[0] + side * 5, knee[1], knee[2]], 3, SHELLY.stripe, -99.8));
    parts.push(limb(view, `sh${side}`, mixV(knee, foot, 0.35), foot, 15, SHELLY.boot, -99.5));
    parts.push(ball(view, `ft${side}`, [foot[0], foot[1] + 4, foot[2]], 8.5, SHELLY.boot, -99));
  });

  // Hair volume: big puffs at the back of the head
  const puffs: [V3, number][] = [
    [[0, -24, 100], 19],
    [[17, -16, 88], 15],
    [[-17, -16, 88], 15],
    [[0, -30, 80], 15],
  ];
  puffs.forEach(([c, r], i) => {
    const pc: V3 = [c[0], c[1], c[2] + bz];
    const pp = project(view, pc);
    parts.push(ball(view, `puff${i}`, pc, r, SHELLY.hair, pp.d > 0 ? 6 : -3));
  });

  // Torso
  parts.push(
    segment(
      view,
      `${uid}body`,
      26 + bz,
      70 + bz,
      18,
      14,
      21,
      15,
      SHELLY.shirt,
      0,
      <g transform={`translate(0 ${-bz * v})`}>
        {band(view, "jeans", 20, 40, 18, 14, SHELLY.jeans)}
        {band(view, "belt", 37, 42, 18.5, 14.5, SHELLY.belt)}
        {band(view, "scarf", 61, 74, 19, 14, SHELLY.scarf)}
      </g>,
    ),
  );
  if (!silhouette && facing(view, 0) > 0.1) {
    const p = project(view, [0, 15, 64 + bz]);
    const fx = Math.max(0.2, Math.cos((phi * Math.PI) / 180));
    parts.push({
      d: 0.35,
      el: (
        <path
          key="knot"
          d={`M ${p.x - 12 * fx} ${p.y - 4} L ${p.x + 12 * fx} ${p.y - 4} L ${p.x + 2 * fx} ${p.y + 14} Z`}
          fill={SHELLY.scarf}
          stroke={shade(SHELLY.scarf, -0.45)}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      ),
    });
  }

  // Gun + arms
  const rc = recoil * 9;
  const gunZ = gun === "aim" ? 62 : 56;
  const gunDrop = gun === "aim" ? 0 : -6;
  const shL: V3 = [22, 0, 64 + bz];
  const shR: V3 = [-22, 0, 64 + bz];
  let handL: V3;
  let handR: V3;
  if (gun === "back") {
    handL = addV(arms.l, [0, 0, bz]);
    handR = addV(arms.r, [0, 0, bz]);
    const g0: V3 = [18, -18, 48 + bz];
    const g1: V3 = [-16, -18, 92 + bz];
    const pg = project(view, mixV(g0, g1, 0.5));
    parts.push({
      d: pg.d - 1,
      el: (
        <g key="gunback">
          {limb(view, "gbs", g0, mixV(g0, g1, 0.3), 9, SHELLY.wood).el}
          {limb(view, "gbb", mixV(g0, g1, 0.3), g1, 10, SHELLY.metal).el}
        </g>
      ),
    });
  } else {
    const back = -rc;
    const butt: V3 = [-7, -4 + back, gunZ - 6 + bz];
    const grip: V3 = [-7, 8 + back, gunZ + bz];
    const recv: V3 = [-7, 20 + back, gunZ + 2 + bz + gunDrop * 0.3];
    const tip: V3 = [-7, 54 + back, gunZ + 4 + bz + gunDrop + recoil * 6];
    const fore0 = mixV(recv, tip, 0.22 - pump * 0.14);
    const fore1 = mixV(recv, tip, 0.5 - pump * 0.14);
    handR = [grip[0], grip[1] + 1, grip[2] - 4];
    handL = mixV(fore0, fore1, 0.5);
    handL = [handL[0] + 2, handL[1], handL[2] - 5];
    const pg = project(view, mixV(grip, tip, 0.5));
    const pb = project(view, butt);
    const pt = project(view, tip);
    parts.push({
      d: pg.d + 0.5,
      el: (
        <g key="gun">
          {glow > 0 && !silhouette ? (
            <line x1={pb.x} y1={pb.y} x2={pt.x} y2={pt.y} stroke="#ffe24a" strokeWidth={30} strokeLinecap="round" opacity={0.5 * glow} />
          ) : null}
          {limb(view, "stock", butt, grip, 9, SHELLY.wood).el}
          {limb(view, "recv", grip, recv, 13, SHELLY.metalDark).el}
          {limb(view, "barrel", recv, tip, 13, SHELLY.metal).el}
          {limb(view, "muzzle", mixV(recv, tip, 0.9), tip, 15, SHELLY.metal).el}
          {limb(view, "fore", fore0, fore1, 11, SHELLY.wood).el}
        </g>
      ),
    });
  }
  ([-1, 1] as const).forEach((side) => {
    const sh = side === 1 ? shL : shR;
    const h = side === 1 ? handL : handR;
    const el = elbow(sh, h, side, 7, 7);
    const pel = project(view, el);
    const ph = project(view, h);
    parts.push({
      d: (pel.d + ph.d) / 2 + 1,
      el: (
        <g key={`arm${side}`}>
          {limb(view, `up${side}`, sh, mixV(sh, el, 0.6), 15, SHELLY.shirt).el}
          {limb(view, `ua${side}`, mixV(sh, el, 0.55), el, 11, SHELLY.skin).el}
          {limb(view, `fa${side}`, el, h, 11, SHELLY.skin).el}
          {ball(view, `hd${side}`, h, 7, SHELLY.skin).el}
        </g>
      ),
    });
  });

  // Head with side locks framing the face
  const hc: V3 = [HEAD_C[0], HEAD_C[1], HEAD_C[2] + bz];
  const hp = project(view, hc);
  const clipId = `sclip-${uid}`;
  ([-1, 1] as const).forEach((side) => {
    const top: V3 = [side * 25, 2, 100 + bz];
    const bot: V3 = [side * 26, 2, 74 + bz];
    const p = project(view, mixV(top, bot, 0.5));
    parts.push({ d: p.d >= hp.d - 1 ? hp.d + 4 : hp.d - 0.5, el: limb(view, `lock${side}`, top, bot, 10, SHELLY.hair).el });
  });
  parts.push({
    d: hp.d + 3,
    el: (
      <g key="head">
        {ball(view, "skull", hc, HEAD_R, SHELLY.hair).el}
        {silhouette ? null : (
          <>
            <clipPath id={clipId}>
              <circle cx={hp.x} cy={hp.y} r={HEAD_R} />
            </clipPath>
            <g clipPath={`url(#${clipId})`} transform={`translate(0 ${-bz * v})`}>
              {headDecals(view, expr)}
            </g>
          </>
        )}
      </g>
    ),
  });

  return (
    <g>
      {shadow ? <Shadow r={30} t={GROUND_T} opacity={0.3 * (1 - Math.min(1, lift / 120))} /> : null}
      {renderParts(parts)}
    </g>
  );
};
