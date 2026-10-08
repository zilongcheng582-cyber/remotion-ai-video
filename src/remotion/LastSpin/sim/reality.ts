import { BEAT, STATS } from "../constants";
import { faceToward, lerp, track, track2 } from "../engine/math";
import { blendArms, PRIMO_POSES, PrimoArms, PrimoExpr } from "../characters/ElPrimo";
import { ShellyExpr, ShellyGun } from "../characters/Shelly";
import { SPOT } from "../world/map";

// Deterministic "match simulation" for every reality shot. Given an absolute
// film frame it returns where everyone is, what they're doing, and the HUD
// state. Fantasy frames (210-419) are frozen game time: the betrayal at frame
// 420 happens a fraction of a second (game time) after the spin.

// --- Game-time mapping -------------------------------------------------------
// Real time until the slow-motion; then time dilates as El Primo daydreams.
const speedAt = (f: number) =>
  f < BEAT.slowMoStart ? 1 : lerp(f, [BEAT.slowMoStart, 170], [1, 0.12]);

const gameTimeTable: number[] = (() => {
  const out: number[] = [0];
  for (let f = 1; f <= 260; f++) out.push(out[f - 1] + speedAt(f - 1));
  return out;
})();

/** Game time (in 30 fps game frames) elapsed at film frame f (f < 420). */
export const gameTime = (f: number) => {
  const i = Math.max(0, Math.min(259, Math.floor(f)));
  return gameTimeTable[i] + (gameTimeTable[i + 1] - gameTimeTable[i]) * (f - i);
};

// Game frames between El Primo's last damage and the betrayal shot:
// last hit -> slow-mo start is real time, slow-mo is dilated, fantasy is frozen.
export const REGEN_GAP_SECONDS = (gameTime(210) - gameTime(BEAT.banditHit2) + 3) / 30;

export type PrimoState = {
  x: number;
  y: number;
  phi: number;
  walk: number;
  walkAmt: number;
  arms: PrimoArms;
  expr: PrimoExpr;
  bob: number;
  hp: number;
  flash: number;
  fall: number; // 0..1 knocked over
  opacity: number;
  visible: boolean;
  joy: [number, number]; // joystick knob offset (-1..1)
};

export type ShellyState = {
  x: number;
  y: number;
  phi: number;
  walk: number;
  walkAmt: number;
  gun: ShellyGun;
  recoil: number;
  pump: number;
  glow: number;
  hp: number;
  superCharge: number;
  expr: ShellyExpr;
  visible: boolean;
  cubes: number;
};

export type BanditState = {
  x: number;
  y: number;
  phi: number;
  walk: number;
  walkAmt: number;
  recoil: number;
  hp: number;
  flash: number;
  opacity: number;
};

export type CamState = { x: number; y: number; zoom: number; shake: [number, number] };

const P = SPOT;

// Spin angles (degrees). Shelly starts alone; once El Primo joins they turn at
// the same rate, mirrored, so they face each other on every revolution.
const SYNC_RATE = 22;
export const shellySpinPhi = (f: number) => {
  const g = (a: number) => gameTime(a) - gameTime(BEAT.shellySpinStart);
  if (f < BEAT.primoSpinStart) return -90 + g(f) * 19;
  return -90 + g(BEAT.primoSpinStart) * 19 + (gameTime(f) - gameTime(BEAT.primoSpinStart)) * SYNC_RATE;
};
const angleMix = (a: number, b: number, t: number) => {
  const d = ((((b - a) % 360) + 540) % 360) - 180;
  return a + d * t;
};
export const primoSpinPhi = (f: number) =>
  angleMix(90, shellySpinPhi(f) + 180, lerp(f, [BEAT.primoSpinStart, BEAT.primoSpinStart + 6], [0, 1]));
const pulse = (f: number, at: number, len: number) =>
  f >= at && f < at + len ? 1 - (f - at) / len : 0;

// --- El Primo ------------------------------------------------------------------
const primoPos = (f: number): [number, number] => {
  if (f < 420) {
    const base = track2(f, [
      [0, [1250, 1070]],
      [24, [1222, 1036]],
      [44, [1200, 1012]],
      [70, [1206, 1006]],
      [84, P.primo],
    ]);
    if (f >= BEAT.primoSpinStart) {
      // spinning the joystick in a tight circle
      const g = gameTime(f) - gameTime(BEAT.primoSpinStart);
      const a = (g * SYNC_RATE * Math.PI) / 180;
      const r = lerp(f, [BEAT.primoSpinStart, BEAT.primoSpinStart + 8], [0, 7]);
      return [base[0] + Math.sin(a) * r, base[1] + (Math.cos(a) - 1) * r];
    }
    return base;
  }
  // knockback from the Super toward the wall
  return [
    track(f, [
      [BEAT.superHit, P.primo[0]],
      [BEAT.superHit + 8, P.primoKnock[0]],
    ], (t) => 1 - (1 - t) ** 3),
    P.primo[1],
  ];
};

const primoState = (f: number): PrimoState => {
  const [x, y] = primoPos(f);
  const [px, py] = primoPos(f - 1);
  const moving = Math.hypot(x - px, y - py);
  let phi: number;
  let arms = PRIMO_POSES.guard;
  let expr: PrimoExpr = { eyes: "open", mouth: "flat", brow: 1 };
  let bob = 0;
  const toBandit = faceToward(x, y, P.banditStart[0], P.banditStart[1]);
  const toShelly = 90;

  if (f < 420) {
    phi = track(f, [
      [0, toBandit],
      [74, toBandit],
      [88, toShelly],
    ]);
    if (f >= BEAT.primoSpinStart) {
      phi = primoSpinPhi(f);
    }
    // skirmish flinches
    const h1 = pulse(f, BEAT.banditHit1, 8);
    const h2 = pulse(f, BEAT.banditHit2, 8);
    if (h1 || h2) expr = { eyes: "wide", mouth: "o", brow: -0.5 };
    if (f >= BEAT.standoff && f < BEAT.primoSurprise) {
      arms = blendArms(PRIMO_POSES.guard, PRIMO_POSES.idle, lerp(f, [84, 96], [0, 0.4]));
      expr = { eyes: "open", mouth: "flat", brow: 0.4, look: [0.6, 0] };
    }
    if (f >= BEAT.primoSurprise && f < BEAT.primoSpinStart) {
      arms = blendArms(PRIMO_POSES.idle, PRIMO_POSES.flinch, lerp(f, [106, 110], [0, 1]) * lerp(f, [112, 118], [1, 0.3]));
      expr = { eyes: "wide", mouth: "o", brow: -0.6, look: [0.8, -0.2] };
      bob = Math.max(0, Math.sin(((f - BEAT.primoSurprise) / 7) * Math.PI)) * 12 * (f < 113 ? 1 : 0);
      if (f > 113) expr = { eyes: "open", mouth: "smile", brow: -0.4, look: [0.8, 0] };
    }
    if (f >= BEAT.primoSpinStart) {
      arms = blendArms(PRIMO_POSES.idle, PRIMO_POSES.spin, lerp(f, [118, 124], [0, 1]));
      expr = { eyes: "happy", mouth: "grin", brow: -0.3 };
      bob = Math.abs(Math.sin((gameTime(f) / 30) * Math.PI * 3)) * 5;
    }
  } else {
    // Betrayal: frozen mid-spin, turning toward the shooter in disbelief
    phi = track(f, [
      [420, 64],
      [432, 76],
      [450, 88],
    ]);
    arms = blendArms(PRIMO_POSES.spin, PRIMO_POSES.flinch, lerp(f, [421, 436], [0.15, 0.55]));
    expr = { eyes: "wide", mouth: "o", brow: -1, look: [0.9, 0] };
    if (f >= 444) expr = { eyes: "sad", mouth: "frown", brow: -1, look: [1, 0] };
    if (f >= BEAT.superHit) {
      arms = PRIMO_POSES.flinch;
      expr = { eyes: "closed", mouth: "open", brow: -1 };
    }
  }

  const hp =
    f < BEAT.banditHit1
      ? STATS.primoMaxHp
      : f < BEAT.banditHit2
        ? STATS.primoMaxHp - STATS.banditVolley
        : f < BEAT.bang + 1
          ? STATS.primoHpAfterSkirmish
          : f < BEAT.superHit
            ? STATS.primoHpAfterSkirmish - STATS.shellyAttack
            : 0;

  const flash = Math.max(
    pulse(f, BEAT.banditHit1, 5),
    pulse(f, BEAT.banditHit2, 5),
    pulse(f, BEAT.bang + 1, 4),
    pulse(f, BEAT.superHit, 4),
  );
  const fall = lerp(f, [BEAT.superHit + 2, BEAT.superHit + 14], [0, 1], (t) => 1 - (1 - t) ** 2);
  const opacity = lerp(f, [BEAT.primoPoof - 2, BEAT.primoPoof + 10], [1, 0]);
  const walkAmt = f >= BEAT.primoSpinStart && f < 420 ? 0.8 : Math.min(1, moving / 2.5);
  const dirx = moving > 0.3 ? (x - px) / moving : 0;
  const diry = moving > 0.3 ? (y - py) / moving : 0;
  let joy: [number, number] = [dirx * Math.min(1, moving / 2), diry * Math.min(1, moving / 2)];
  if (f >= BEAT.primoSpinStart && f < 420) {
    const a = ((phi - 90) * Math.PI) / 180;
    joy = [Math.sin(a + Math.PI / 2) * 0.85, Math.cos(a + Math.PI / 2) * 0.85];
  }
  return {
    x,
    y,
    phi,
    walk: (f < 420 ? gameTime(f) : f) * 0.42,
    walkAmt,
    arms,
    expr,
    bob,
    hp,
    flash,
    fall,
    opacity,
    visible: f < BEAT.primoPoof + 10,
    joy,
  };
};

// --- Shelly ------------------------------------------------------------------
const shellyPos = (f: number): [number, number] => {
  if (f < 420) {
    const base = track2(f, [
      [12, P.shellyEnter],
      [50, P.shellyFire],
      [66, P.shellyFire],
      [84, P.shelly],
    ]);
    if (f >= BEAT.shellySpinStart) {
      const g = gameTime(f) - gameTime(BEAT.shellySpinStart);
      const a = (-g * SYNC_RATE * Math.PI) / 180;
      const r = lerp(f, [BEAT.shellySpinStart, BEAT.shellySpinStart + 8], [0, 6]);
      return [base[0] + Math.sin(a) * r, base[1] + (Math.cos(a) - 1) * r];
    }
    return base;
  }
  return track2(f, [
    [514, P.shelly],
    [BEAT.shellyReachCube, [P.cube[0] + 34, P.cube[1] - 6]],
    [BEAT.shellyLeave, [P.cube[0] + 34, P.cube[1] - 6]],
    [700, P.shellyExit],
  ], (t) => t);
};

const shellyState = (f: number): ShellyState => {
  const [x, y] = shellyPos(f);
  const [px, py] = shellyPos(f - 1);
  const moving = Math.hypot(x - px, y - py);
  const travel = moving > 0.4 ? faceToward(px, py, x, y) : null;
  let phi: number;
  let gun: ShellyGun = "carry";
  let recoil = 0;
  let pump = 0;
  let expr: ShellyExpr = { eyes: "calm", mouth: "flat" };
  const toBandit = faceToward(P.shellyFire[0], P.shellyFire[1], P.banditStart[0], P.banditStart[1]);

  if (f < 420) {
    phi = track(f, [
      [12, faceToward(P.shellyEnter[0], P.shellyEnter[1], P.shellyFire[0], P.shellyFire[1])],
      [44, faceToward(P.shellyEnter[0], P.shellyEnter[1], P.shellyFire[0], P.shellyFire[1])],
      [52, toBandit],
      [66, toBandit],
      [74, -60],
      [84, -90],
    ]);
    if (f >= 50 && f < 66) gun = "aim";
    recoil = pulse(f, BEAT.shellyShootsBandit, 7);
    pump = lerp(f, [62, 66], [0, 1]) * lerp(f, [66, 70], [1, 0]);
    if (f >= BEAT.shellySpinStart) {
      phi = shellySpinPhi(f);
      expr = { eyes: "calm", mouth: "smile" };
    }
  } else {
    phi = -90;
    gun = f < 476 ? "aim" : "carry";
    recoil = Math.max(pulse(f, BEAT.bang, 7), pulse(f, BEAT.superFire, 10) * 1.4);
    pump =
      lerp(f, [428, 432], [0, 1]) * lerp(f, [432, 437], [1, 0]) +
      lerp(f, [476, 480], [0, 1]) * lerp(f, [480, 485], [1, 0]);
    if (f >= 514) phi = travel ?? faceToward(x, y, P.cube[0], P.cube[1]);
    if (f >= BEAT.shellyReachCube && f < BEAT.shellyLeave) {
      phi = track(f, [
        [BEAT.shellyReachCube, faceToward(P.shelly[0], P.shelly[1], P.cube[0], P.cube[1])],
        [BEAT.shellyLeave, faceToward(P.cube[0], P.cube[1], P.shellyExit[0], P.shellyExit[1])],
      ]);
    }
    if (f >= BEAT.shellyLeave) phi = faceToward(P.cube[0], P.cube[1], P.shellyExit[0], P.shellyExit[1]);
  }
  const superCharge =
    f < BEAT.shellyHitsBandit
      ? STATS.shellySuperBefore
      : f < BEAT.bang + 1
        ? lerp(f, [62, 66], [STATS.shellySuperBefore, STATS.shellySuperAfterBandit])
        : f < BEAT.superFire
          ? lerp(f, [421, BEAT.superFull], [0.6, 1])
          : 0;
  const glow = f >= BEAT.superFull && f < BEAT.superFire ? 0.6 + 0.4 * Math.sin(f / 2) : 0;
  return {
    x,
    y,
    phi,
    walk: f * 0.45,
    walkAmt: f >= BEAT.shellySpinStart && f < 420 ? 0.7 : Math.min(1, moving / 2),
    gun,
    recoil: Math.min(1, recoil),
    pump,
    glow,
    hp: 7200,
    superCharge,
    expr,
    visible: f >= 12,
    cubes: f >= BEAT.shellyReachCube + 4 ? 1 : 0,
  };
};

// --- Bandit ------------------------------------------------------------------
const banditState = (f: number): BanditState => {
  const pos = track2(f, [
    [0, P.banditStart],
    [20, [P.banditStart[0] + 22, P.banditStart[1] - 8]],
    [40, [P.banditStart[0] - 6, P.banditStart[1] + 4]],
    [70, P.banditStart],
    [96, P.banditBush],
  ]);
  const prev = track2(f - 1, [
    [0, P.banditStart],
    [20, [P.banditStart[0] + 22, P.banditStart[1] - 8]],
    [40, [P.banditStart[0] - 6, P.banditStart[1] + 4]],
    [70, P.banditStart],
    [96, P.banditBush],
  ]);
  const moving = Math.hypot(pos[0] - prev[0], pos[1] - prev[1]);
  const toPrimo = faceToward(pos[0], pos[1], P.primo[0], P.primo[1]);
  const flee = faceToward(P.banditStart[0], P.banditStart[1], P.banditBush[0], P.banditBush[1]);
  return {
    x: pos[0],
    y: pos[1],
    phi: f < 72 ? toPrimo : flee,
    walk: f * 0.5,
    walkAmt: Math.min(1, moving / 2),
    recoil: Math.max(pulse(f, BEAT.banditVolley1, 5), pulse(f, BEAT.banditVolley1 + 3, 5), pulse(f, BEAT.banditParting, 5)),
    hp: f < BEAT.shellyHitsBandit ? 7400 : 7400 - STATS.banditDamageTaken,
    flash: pulse(f, BEAT.shellyHitsBandit, 6),
    opacity: lerp(f, [86, 96], [1, 0]),
  };
};

// --- Camera -------------------------------------------------------------------
const camState = (f: number): CamState => {
  let x: number;
  let y: number;
  let zoom: number;
  if (f < 420) {
    x = track(f, [
      [0, 1400],
      [56, 1410],
      [96, 1295],
      [BEAT.slowMoStart, 1290],
      [205, 1228],
    ]);
    y = track(f, [
      [0, 990],
      [56, 1010],
      [96, 1010],
      [BEAT.slowMoStart, 1000],
      [205, 935],
    ]);
    zoom = track(f, [
      [0, 1.18],
      [56, 1.2],
      [96, 1.42],
      [BEAT.slowMoStart, 1.46],
      [205, 1.8],
    ]);
  } else {
    x = track(f, [
      [420, 1290],
      [462, 1280],
      [490, 1230],
      [530, 1160],
      [720, 1165],
      [800, 1205],
      [840, 1210],
    ]);
    y = track(f, [
      [420, 990],
      [490, 990],
      [530, 975],
      [720, 975],
      [800, 800],
      [840, 790],
    ]);
    zoom = track(f, [
      [420, 1.6],
      [452, 1.6],
      [461, 1.7],
      [490, 1.6],
      [530, 1.55],
      [720, 1.68],
      [840, 1.9],
    ]);
  }
  const s1 = f >= BEAT.superFire && f < BEAT.superFire + 14 ? (1 - (f - BEAT.superFire) / 14) * 16 : 0;
  const s0 = f >= BEAT.bang && f < BEAT.bang + 6 ? (1 - (f - BEAT.bang) / 6) * 7 : 0;
  const s = s1 + s0;
  return {
    x,
    y,
    zoom,
    shake: [Math.sin(f * 2.7) * s, Math.cos(f * 3.9) * s * 0.7],
  };
};

export const reality = (f: number) => ({
  primo: primoState(f),
  shelly: shellyState(f),
  bandit: banditState(f),
  cam: camState(f),
  counter: f >= BEAT.counterDrop ? 9 : 10,
  wallBroken: f >= BEAT.superHit + 1,
});

export type RealityState = ReturnType<typeof reality>;
