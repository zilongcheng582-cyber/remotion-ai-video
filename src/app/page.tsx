"use client";

import { Player } from "@remotion/player";
import type { NextPage } from "next";
import { useMemo, useState } from "react";
import { z } from "zod";
import {
  defaultLastSpinProps,
  defaultMotionDemoProps,
  LAST_SPIN_DURATION_IN_FRAMES,
  LAST_SPIN_FPS,
  LAST_SPIN_HEIGHT,
  LAST_SPIN_NAME,
  LAST_SPIN_WIDTH,
  MOTION_DEMO_DURATION_IN_FRAMES,
  MOTION_DEMO_FPS,
  MOTION_DEMO_HEIGHT,
  MOTION_DEMO_NAME,
  MOTION_DEMO_WIDTH,
  MotionDemoProps,
} from "../../types/constants";
import { RenderControls } from "../components/RenderControls";
import { Tips } from "../components/Tips";
import { LastSpin } from "../remotion/LastSpin/LastSpin";
import { MotionDemo } from "../remotion/MotionDemo/MotionDemo";

type CompositionChoice = typeof MOTION_DEMO_NAME | typeof LAST_SPIN_NAME;

const CHOICES: { id: CompositionChoice; label: string }[] = [
  { id: MOTION_DEMO_NAME, label: "MotionDemo" },
  { id: LAST_SPIN_NAME, label: "LastSpin (28s film)" },
];

const Home: NextPage = () => {
  const [compositionId, setCompositionId] =
    useState<CompositionChoice>(MOTION_DEMO_NAME);
  const [title, setTitle] = useState<string>(defaultMotionDemoProps.title);
  const [subtitle, setSubtitle] = useState<string>(
    defaultMotionDemoProps.subtitle,
  );

  const motionDemoProps: z.infer<typeof MotionDemoProps> = useMemo(() => {
    return { title, subtitle };
  }, [title, subtitle]);

  const isLastSpin = compositionId === LAST_SPIN_NAME;

  return (
    <div>
      <div className="max-w-screen-md m-auto mb-5 px-4 mt-16 flex flex-col gap-10">
        <div className="flex flex-row gap-2" role="tablist">
          {CHOICES.map((choice) => (
            <button
              key={choice.id}
              role="tab"
              aria-selected={compositionId === choice.id}
              onClick={() => setCompositionId(choice.id)}
              className={`rounded-geist px-4 py-2 text-sm font-medium border ${
                compositionId === choice.id
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background text-foreground border-unfocused-border-color"
              }`}
            >
              {choice.label}
            </button>
          ))}
        </div>
        <div className="overflow-hidden rounded-geist shadow-[0_0_200px_rgba(0,0,0,0.15)]">
          {isLastSpin ? (
            <Player
              key={LAST_SPIN_NAME}
              component={LastSpin}
              inputProps={defaultLastSpinProps}
              durationInFrames={LAST_SPIN_DURATION_IN_FRAMES}
              fps={LAST_SPIN_FPS}
              compositionHeight={LAST_SPIN_HEIGHT}
              compositionWidth={LAST_SPIN_WIDTH}
              style={{
                width: "100%",
              }}
              controls
              initiallyMuted
            />
          ) : (
            <Player
              key={MOTION_DEMO_NAME}
              component={MotionDemo}
              inputProps={motionDemoProps}
              durationInFrames={MOTION_DEMO_DURATION_IN_FRAMES}
              fps={MOTION_DEMO_FPS}
              compositionHeight={MOTION_DEMO_HEIGHT}
              compositionWidth={MOTION_DEMO_WIDTH}
              style={{
                width: "100%",
              }}
              controls
              autoPlay
              loop
              initiallyMuted
            />
          )}
        </div>
        <section className="flex flex-col gap-4">
          {isLastSpin ? (
            <RenderControls
              key={LAST_SPIN_NAME}
              compositionId={LAST_SPIN_NAME}
              inputProps={defaultLastSpinProps}
              note="The Last Spin — an unofficial, wordless Brawl Stars-inspired fan short (28 s, 1920×1080, 30 fps, with sound). Unmute the player to hear the score."
            ></RenderControls>
          ) : (
            <RenderControls
              key={MOTION_DEMO_NAME}
              compositionId={MOTION_DEMO_NAME}
              inputProps={motionDemoProps}
              text={{ title, setTitle, subtitle, setSubtitle }}
            ></RenderControls>
          )}
        </section>
        <Tips></Tips>
      </div>
    </div>
  );
};

export default Home;
