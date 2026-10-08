import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { BEAT, SCENES } from "./constants";
import { lerp } from "./engine/math";
import { FantasyDusk } from "./fantasy/FantasyDusk";
import { FantasyLegends } from "./fantasy/FantasyLegends";
import { FantasySeaside } from "./fantasy/FantasySeaside";
import { Bubbles } from "./fantasy/common";
import { useLastSpinFont } from "./font";
import { Vortex } from "./fx/Vortex";
import { RealityScene } from "./scenes/RealityScene";
import { SuperCloseup } from "./scenes/SuperCloseup";
import { Soundtrack } from "./audio/Soundtrack";

// "The Last Spin" — a 28 s, wordless Brawl Stars-inspired fan short.
// Reality shots share one simulated match (sim/reality.ts); the fantasy runs
// in El Primo's head while game time is frozen.

/** Color grade for reality: vivid -> warm daydream -> cold after the betrayal. */
const realityFilter = (f: number) => {
  if (f < 420) {
    const warm = lerp(f, [BEAT.slowMoStart, 205], [0, 1]);
    return `saturate(${1.06 + warm * 0.2}) sepia(${warm * 0.22}) brightness(${1 + warm * 0.05})`;
  }
  const cold = lerp(f, [BEAT.superHit, 530], [0, 1]);
  const mem = lerp(f, [720, 800], [0, 1]);
  return `saturate(${1 - cold * 0.45 - mem * 0.15}) brightness(${1 - cold * 0.06 - mem * 0.1}) contrast(${1 - cold * 0.05})`;
};

export const LastSpin: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  useLastSpinFont();

  const vignette = lerp(frame, [500, 600], [0, 0.35]) + lerp(frame, [770, BEAT.blackStart], [0, 0.65]);
  const black = lerp(frame, [806, BEAT.blackStart], [0, 1]);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* Scenes 1-2: encounter and first spin */}
      <Sequence name="Encounter + First Spin" from={SCENES.encounter.from} durationInFrames={SCENES.fantasyA.from + 12} premountFor={fps}>
        <AbsoluteFill style={{ filter: realityFilter(frame) }}>
          <RealityScene frame={Math.min(frame, 209)} />
        </AbsoluteFill>
      </Sequence>

      {/* Scene 3: the fantasy */}
      <Sequence name="Fantasy A — best friends" from={SCENES.fantasyA.from} durationInFrames={94} premountFor={fps}>
        <FantasySeaside frame={frame} />
      </Sequence>
      <Sequence name="Fantasy B — always there" from={SCENES.fantasyB.from - 6} durationInFrames={66} premountFor={fps}>
        <AbsoluteFill style={{ opacity: lerp(frame, [294, 304], [0, 1]) }}>
          <FantasyDusk frame={Math.max(frame, 300)} />
        </AbsoluteFill>
      </Sequence>
      <Sequence name="Bubble wipe" from={284} durationInFrames={24}>
        <AbsoluteFill style={{ opacity: lerp(frame, [284, 292], [0, 1]) * lerp(frame, [300, 308], [1, 0]) }}>
          <svg width={1920} height={1080}>
            <Bubbles frame={(frame - 284) * 3} count={60} seed={9} />
          </svg>
        </AbsoluteFill>
      </Sequence>
      <Sequence name="Fantasy C — legendary partners" from={SCENES.fantasyC.from} durationInFrames={60} premountFor={fps}>
        <FantasyLegends frame={frame} />
      </Sequence>

      {/* Scenes 4-6: betrayal, indifference, last memory */}
      <Sequence name="Betrayal — attack" from={BEAT.bang} durationInFrames={BEAT.closeupStart - BEAT.bang} premountFor={fps}>
        <AbsoluteFill style={{ filter: realityFilter(frame) }}>
          <RealityScene frame={frame} />
        </AbsoluteFill>
      </Sequence>
      <Sequence name="Super ready close-up" from={BEAT.closeupStart} durationInFrames={BEAT.closeupEnd - BEAT.closeupStart} premountFor={fps}>
        <SuperCloseup frame={frame} />
      </Sequence>
      <Sequence name="Super, indifference, memory" from={BEAT.closeupEnd} durationInFrames={840 - BEAT.closeupEnd} premountFor={fps}>
        <AbsoluteFill style={{ filter: realityFilter(frame) }}>
          <RealityScene frame={frame} />
        </AbsoluteFill>
      </Sequence>

      {/* Spin -> dream vortex */}
      <Vortex frame={frame} start={BEAT.vortexStart} mid={SCENES.fantasyA.from} end={SCENES.fantasyA.from + 14} cx={935} cy={420} />

      {/* closing vignette and fade to black */}
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse at 48% 38%, rgba(0,0,0,0) 22%, rgba(0,0,0,1) 78%)",
          opacity: Math.min(1, vignette),
        }}
      />
      <AbsoluteFill style={{ background: "#000", opacity: black }} />

      <Soundtrack />
    </AbsoluteFill>
  );
};
