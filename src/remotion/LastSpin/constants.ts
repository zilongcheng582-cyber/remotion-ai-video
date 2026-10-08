// Master timing sheet for "The Last Spin". Every scene, sound cue and gameplay
// event is keyed off these absolute frame numbers (30 fps, 840 frames).

export const LAST_SPIN_FPS = 30;
export const LAST_SPIN_DURATION = 840;
export const LAST_SPIN_WIDTH = 1920;
export const LAST_SPIN_HEIGHT = 1080;

export const SCENES = {
  encounter: { from: 0, to: 90 },
  firstSpin: { from: 90, to: 210 },
  fantasyA: { from: 210, to: 300 },
  fantasyB: { from: 300, to: 360 },
  fantasyC: { from: 360, to: 420 },
  betrayal: { from: 420, to: 510 },
  indifference: { from: 510, to: 720 },
  lastMemory: { from: 720, to: 840 },
} as const;

// Gameplay beats (absolute frames).
export const BEAT = {
  banditVolley1: 6,
  banditHit1: 14,
  shellyArrive: 52,
  shellyShootsBandit: 56,
  shellyHitsBandit: 62,
  banditParting: 70,
  banditHit2: 78, // El Primo's last damage before the betrayal
  standoff: 84,
  shellySpinStart: 100,
  primoSurprise: 106,
  primoSpinStart: 118,
  heartPin: 128,
  shellyPin: 140,
  slowMoStart: 132,
  vortexStart: 186,
  fantasyStart: 210,
  bang: 420, // hard cut: ordinary attack lands
  superFull: 425,
  closeupStart: 440,
  superReadyCue: 444,
  closeupEnd: 452,
  superFire: 462,
  superHit: 464,
  counterDrop: 470,
  primoPoof: 486,
  cubeDrop: 492,
  hudGone: 530,
  pianoStart: 530,
  shellyReachCube: 560,
  shellyLeave: 578,
  memoryStart: 720,
  heartAlone: 776,
  blackStart: 818,
} as const;

// Gameplay numbers (Power Level 11 working reference values from the brief;
// see public/last-spin/ASSET_MANIFEST.md for the verification caveat).
export const STATS = {
  primoMaxHp: 13000,
  primoHpAfterSkirmish: 8400,
  banditVolley: 2300,
  shellyAttack: 3000, // 5 pellets x 600, point blank
  shellySuper: 5760, // 9 pellets x 640, point blank
  shellySuperBefore: 0.42,
  shellySuperAfterBandit: 0.6,
  shellyBanditHp: 9600,
  banditDamageTaken: 1800,
};

export const FONT = "LilitaOne, 'Arial Black', Impact, sans-serif";
