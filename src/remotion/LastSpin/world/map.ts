// One coherent Solo Showdown-style desert map. Every reality shot in the film
// is framed inside this layout (tile = 100 world units).
//   .  sand        W  rock wall          D  destructible wall (Super target)
//   B  bush        C  power cube box     X  cactus
//   R  barrel      s  small rocks/bones  (decor)
export const TILE = 100;

export const MAP_ROWS = [
  //0         1         2
  //0123456789012345678901234567
  "............................", // 0
  "....BBB..........WWW....BBB.", // 1
  "....BBB....X.....WWW....BBB.", // 2
  "..W..........C..........W...", // 3
  "..W.....BBB.........s...W...", // 4
  "..W.....BBB......BBBB.......", // 5
  "......WWW.....X..BBBB...C...", // 6
  "...s..W....BBBB..BBB.....X..", // 7
  "...C..W....BBBB.............", // 8
  "..........D.........WW..R...", // 9
  ".....X....D.........WW......", // 10
  "...........s..........s.....", // 11
  "..W.....C...............X...", // 12
  "..W........R................", // 13
  "..W.....WWWW..X.......BBB...", // 14
  "........WWWW..........BBB...", // 15
  "...BBB.............C........", // 16
  "...BBB.........s......WWW...", // 17
  "......................WWW...", // 18
  "............................", // 19
];

export type Cell = { kind: string; col: number; row: number };

export const cells: Cell[] = MAP_ROWS.flatMap((line, row) =>
  line
    .split("")
    .map((kind, col) => ({ kind, col, row }))
    .filter((c) => c.kind !== "."),
);

export const MAP_W = MAP_ROWS[0].length * TILE;
export const MAP_H = MAP_ROWS.length * TILE;

// Key story positions (world units).
export const SPOT = {
  primo: [1215, 1005] as [number, number],
  shelly: [1365, 1005] as [number, number],
  primoKnock: [1118, 1005] as [number, number],
  cube: [1150, 1015] as [number, number],
  banditStart: [1560, 770] as [number, number],
  banditBush: [1860, 560] as [number, number],
  shellyEnter: [1720, 1300] as [number, number],
  shellyFire: [1540, 1095] as [number, number],
  shellyExit: [2150, 720] as [number, number],
};
