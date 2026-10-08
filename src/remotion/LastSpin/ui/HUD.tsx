import React from "react";
import { FONT } from "../constants";
import { clamp01, pop } from "../engine/math";

// Screen-space gameplay HUD (El Primo is the player): Brawlers-left counter,
// movement joystick, attack button and Super button with charge ring.

const outline = {
  fontFamily: FONT,
  paintOrder: "stroke" as const,
  stroke: "#120a06",
  strokeLinejoin: "round" as const,
};

export const BrawlersLeft: React.FC<{ count: number; changedAt: number; frame: number; opacity?: number }> = ({
  count,
  changedAt,
  frame,
  opacity = 1,
}) => {
  const bump = frame >= changedAt ? pop(frame, changedAt, 12) : 1;
  const flash = frame >= changedAt && frame < changedAt + 12 ? 1 - (frame - changedAt) / 12 : 0;
  return (
    <g transform="translate(52 92)" opacity={opacity}>
      <text x={0} y={0} fontSize={54} fill="#ffffff" strokeWidth={10} style={outline}>
        BRAWLERS LEFT:{" "}
        <tspan fontSize={62 * bump} fill={flash > 0 ? "#ff5a4a" : "#ffffff"}>
          {count}
        </tspan>
      </text>
    </g>
  );
};

export const Joystick: React.FC<{ knob: [number, number]; active: boolean }> = ({ knob, active }) => {
  const cx = 250;
  const cy = 860;
  return (
    <g opacity={active ? 0.9 : 0.55}>
      <circle cx={cx} cy={cy} r={118} fill="#1b3a6b" opacity={0.28} stroke="#ffffff" strokeOpacity={0.35} strokeWidth={4} />
      <circle cx={cx} cy={cy} r={84} fill="none" stroke="#ffffff" strokeOpacity={0.12} strokeWidth={3} />
      <circle cx={cx + knob[0] * 66} cy={cy + knob[1] * 66} r={50} fill="#3a7bd5" opacity={0.85} stroke="#cfe3ff" strokeWidth={4} />
      <circle cx={cx + knob[0] * 66 - 12} cy={cy + knob[1] * 66 - 14} r={16} fill="#ffffff" opacity={0.25} />
    </g>
  );
};

const Fist: React.FC = () => (
  <g>
    <path d="M -22 -6 Q -22 -22 -6 -22 L 16 -22 Q 26 -22 26 -10 L 26 10 Q 26 22 12 22 L -8 22 Q -22 22 -22 8 Z" fill="#fff" stroke="#120a06" strokeWidth={4} />
    <path d="M -2 -22 L -2 -6 M 10 -22 L 10 -6 M -14 -6 L 26 -6" stroke="#120a06" strokeWidth={3} />
  </g>
);

const BodySlam: React.FC = () => (
  <g>
    <path d="M -20 14 L 0 -22 L 20 14 Z" fill="#fff" stroke="#120a06" strokeWidth={4} strokeLinejoin="round" />
    <path d="M -30 22 L 30 22" stroke="#fff" strokeWidth={6} strokeLinecap="round" />
  </g>
);

export const AttackButtons: React.FC<{ superCharge: number; pressed?: number }> = ({ superCharge, pressed = 0 }) => (
  <g>
    {/* Super (El Primo's own, partially charged) */}
    <g transform="translate(1508 840)">
      <circle r={70} fill="#120a06" opacity={0.35} />
      <circle r={58} fill="#6b6253" stroke="#120a06" strokeWidth={4} />
      <circle
        r={64}
        fill="none"
        stroke="#ffcf1f"
        strokeWidth={8}
        strokeDasharray={`${2 * Math.PI * 64 * clamp01(superCharge)} 999`}
        transform="rotate(-90)"
        strokeLinecap="round"
      />
      <g opacity={0.7}>
        <BodySlam />
      </g>
    </g>
    {/* Attack */}
    <g transform={`translate(1700 900) scale(${1 - pressed * 0.08})`}>
      <circle r={100} fill="#120a06" opacity={0.35} />
      <circle r={86} fill="#e8463a" stroke="#120a06" strokeWidth={5} />
      <circle r={70} fill="#ff6a55" opacity={0.6} />
      <ellipse cx={-26} cy={-34} rx={28} ry={14} fill="#fff" opacity={0.25} transform="rotate(-30 -26 -34)" />
      <Fist />
    </g>
    {/* Gadget slot */}
    <g transform="translate(1786 730)">
      <circle r={36} fill="#2a8a3a" stroke="#120a06" strokeWidth={4} opacity={0.85} />
      <path d="M -10 -12 L 10 -12 L 6 12 L -6 12 Z" fill="#fff" opacity={0.9} />
    </g>
  </g>
);

export const HUD: React.FC<{
  frame: number;
  count: number;
  changedAt: number;
  knob: [number, number];
  joyActive: boolean;
  opacity: number;
  counterOpacity: number;
}> = ({ frame, count, changedAt, knob, joyActive, opacity, counterOpacity }) => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0 }}>
    <BrawlersLeft count={count} changedAt={changedAt} frame={frame} opacity={counterOpacity} />
    <g opacity={opacity}>
      <Joystick knob={knob} active={joyActive} />
      <AttackButtons superCharge={0.35} />
    </g>
  </svg>
);
