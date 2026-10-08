import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ElPrimo, PRIMO_POSES } from "../characters/ElPrimo";
import { Shelly } from "../characters/Shelly";

// Development turnaround sheet: both rigs from eight facing angles.
// Frame number drives a continuous spin in the bottom row.
const ANGLES = [0, 45, 90, 135, 180, -135, -90, -45];

export const RigSheet: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#e9c98f" }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        {ANGLES.map((a, i) => (
          <g key={`p${a}`} transform={`translate(${140 + i * 230} 300) scale(1.6)`}>
            <ElPrimo uid={`sp${i}`} phi={a} expr={{ mouth: "grin" }} />
          </g>
        ))}
        {ANGLES.map((a, i) => (
          <g key={`s${a}`} transform={`translate(${140 + i * 230} 600) scale(1.6)`}>
            <Shelly uid={`ss${i}`} phi={a} gun="aim" />
          </g>
        ))}
        <g transform="translate(300 950) scale(1.6)">
          <ElPrimo uid="spin" phi={frame * 20} arms={PRIMO_POSES.spin} walk={frame * 0.5} walkAmt={1} expr={{ eyes: "happy", mouth: "grin" }} />
        </g>
        <g transform="translate(600 950) scale(1.6)">
          <Shelly uid="sspin" phi={frame * 20} walk={frame * 0.5} walkAmt={1} />
        </g>
        <g transform="translate(900 950) scale(1.6)">
          <ElPrimo uid="hf" phi={20} arms={PRIMO_POSES.highFive} expr={{ eyes: "wide", mouth: "o" }} />
        </g>
        <g transform="translate(1200 950) scale(1.6)">
          <Shelly uid="sw" phi={-20} gun="back" arms={{ l: [26, 6, 40], r: [-34, 10, 118] }} expr={{ eyes: "happy", mouth: "laugh" }} />
        </g>
        <g transform="translate(1500 950) scale(1.6)">
          <ElPrimo uid="sad" phi={-30} arms={PRIMO_POSES.slump} expr={{ eyes: "sad", mouth: "frown" }} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
