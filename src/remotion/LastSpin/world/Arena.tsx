import React, { useMemo } from "react";
import { GROUND_T, rand } from "../engine/math";
import { cells, MAP_H, MAP_ROWS, MAP_W, TILE } from "./map";
import { Barrel, Bush, Cactus, Crate, GroundDecor, WallRun, WallShadow } from "./Props";

const T = GROUND_T;

export type Camera = { x: number; y: number; zoom: number };

export type Drawable = { y: number; key: string; node: React.ReactNode };

type WallRunDef = { x0: number; x1: number; row: number; key: string; destructible: boolean; col: number };

// Merge horizontal runs of rock walls; destructible tiles stay individual.
const wallRuns: WallRunDef[] = (() => {
  const runs: WallRunDef[] = [];
  MAP_ROWS.forEach((line, row) => {
    let start = -1;
    for (let col = 0; col <= line.length; col++) {
      const ch = line[col];
      if (ch === "W" && start < 0) start = col;
      if (ch !== "W" && start >= 0) {
        runs.push({ x0: start * TILE, x1: col * TILE, row, key: `w${row}-${start}`, destructible: false, col: start });
        start = -1;
      }
      if (ch === "D") {
        runs.push({ x0: col * TILE, x1: (col + 1) * TILE, row, key: `d${row}-${col}`, destructible: true, col });
      }
    }
  });
  return runs;
})();

const Ground: React.FC = () => {
  // Flat peach sand with faint large-scale floor markings and clusters of
  // orange leaf/pebble chips, as in the Solo Showdown reference.
  const clusters = useMemo(
    () =>
      Array.from({ length: 34 }).map((_, i) => ({
        x: rand(i * 3.3) * MAP_W,
        y: rand(i * 7.1 + 2) * MAP_H * T,
        n: 10 + Math.floor(rand(i * 1.7) * 14),
        spread: 60 + rand(i * 2.9) * 70,
        seed: i,
      })),
    [],
  );
  return (
    <g>
      <rect x={-1200} y={-1200} width={MAP_W + 2400} height={MAP_H * T + 2400} fill="#e08f5e" />
      <rect x={0} y={0} width={MAP_W} height={MAP_H * T} fill="#f3a875" />
      {Array.from({ length: 6 }).map((_, i) => (
        <rect
          key={`mk${i}`}
          x={300 + (i % 3) * 800}
          y={(250 + Math.floor(i / 3) * 900) * T}
          width={420}
          height={420 * T}
          rx={30}
          fill="none"
          stroke="#f7b78a"
          strokeWidth={6}
          opacity={0.55}
          transform={`rotate(45 ${510 + (i % 3) * 800} ${(460 + Math.floor(i / 3) * 900) * T})`}
        />
      ))}
      {clusters.map((c) =>
        Array.from({ length: c.n }).map((_, j) => {
          const x = c.x + (rand(c.seed * 31 + j) - 0.5) * c.spread * 2;
          const y = c.y + (rand(c.seed * 17 + j * 3) - 0.5) * c.spread;
          const r = 4 + rand(c.seed + j * 7) * 5;
          const a = rand(c.seed * 5 + j) * 180;
          return (
            <path
              key={`c${c.seed}-${j}`}
              d={`M ${-r} 0 L 0 ${-r * 0.7} L ${r} 0 L 0 ${r * 0.7} Z`}
              transform={`translate(${x} ${y}) rotate(${a})`}
              fill={j % 3 === 0 ? "#f7b07a" : "#e8834a"}
            />
          );
        }),
      )}
      {cells
        .filter((c) => c.kind === "s")
        .map((c) => (
          <GroundDecor key={`g${c.col}-${c.row}`} col={c.col} row={c.row} />
        ))}
      {wallRuns.map((r) => (
        <WallShadow key={`ws${r.key}`} x0={r.x0} x1={r.x1} y0={r.row * TILE} />
      ))}
    </g>
  );
};

export const Arena: React.FC<{
  frame: number;
  cam: Camera;
  shake?: [number, number];
  groundFx?: React.ReactNode; // ground-level effects (aim cones, marks)
  drawables: Drawable[]; // depth-sorted with the map props
  overlay?: React.ReactNode; // above everything (bars, pins, particles)
  isDestroyed?: (col: number, row: number) => boolean;
  width?: number;
  height?: number;
}> = ({ frame, cam, shake = [0, 0], groundFx, drawables, overlay, isDestroyed, width = 1920, height = 1080 }) => {
  const ground = useMemo(() => <Ground />, []);
  const items: Drawable[] = [...drawables];
  wallRuns.forEach((r) => {
    if (r.destructible && isDestroyed?.(r.col, r.row)) return;
    items.push({
      y: (r.row + 1) * TILE,
      key: r.key,
      node: <WallRun x0={r.x0} x1={r.x1} y0={r.row * TILE} seed={r.row * 40 + r.col} />,
    });
  });
  cells.forEach((c) => {
    const y = (c.row + 1) * TILE - 2;
    const key = `${c.kind}${c.col}-${c.row}`;
    if (c.kind === "B") items.push({ y, key, node: <Bush col={c.col} row={c.row} frame={frame} /> });
    if (c.kind === "C") items.push({ y: y - 14, key, node: <Crate col={c.col} row={c.row} /> });
    if (c.kind === "X") items.push({ y: y - 40, key, node: <Cactus col={c.col} row={c.row} /> });
    if (c.kind === "R") items.push({ y: y - 40, key, node: <Barrel col={c.col} row={c.row} /> });
  });
  items.sort((a, b) => a.y - b.y);
  const tx = width / 2 + shake[0];
  const ty = height / 2 + shake[1];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: "absolute", inset: 0 }}>
      <g transform={`translate(${tx} ${ty}) scale(${cam.zoom}) translate(${-cam.x} ${-cam.y * T})`}>
        {ground}
        {groundFx}
        {items.map((it) => (
          <React.Fragment key={it.key}>{it.node}</React.Fragment>
        ))}
        {overlay}
      </g>
    </svg>
  );
};

/** World point -> projected map-space point (inside the Arena transform). */
export const W = (x: number, y: number, z = 0): [number, number] => [x, y * T - z * 0.84];
