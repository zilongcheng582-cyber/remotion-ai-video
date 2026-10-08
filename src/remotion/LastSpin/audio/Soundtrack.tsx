import { Audio } from "@remotion/media";
import React from "react";
import { interpolate, staticFile, useVideoConfig } from "remotion";
import { Cue, MUSIC, SFX } from "./cues";

const volumeFor = (cue: Cue) => {
  if (!cue.fadeOut || !cue.durationInFrames) return cue.volume;
  const end = cue.durationInFrames;
  const start = end - cue.fadeOut;
  return (f: number) =>
    interpolate(f, [start, end], [cue.volume, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
};

export const Soundtrack: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <>
      {[...MUSIC, ...SFX].map((cue, i) => (
        <Audio
          key={`${cue.file}-${cue.from}-${i}`}
          name={cue.name}
          src={staticFile(`last-spin/audio/${cue.file}`)}
          from={cue.from}
          durationInFrames={cue.durationInFrames}
          volume={volumeFor(cue)}
          premountFor={fps}
        />
      ))}
    </>
  );
};
