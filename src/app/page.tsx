"use client";

import { Player } from "@remotion/player";
import type { NextPage } from "next";
import { useMemo, useState } from "react";
import { z } from "zod";
import {
  defaultMotionDemoProps,
  MOTION_DEMO_DURATION_IN_FRAMES,
  MOTION_DEMO_FPS,
  MOTION_DEMO_HEIGHT,
  MOTION_DEMO_WIDTH,
  MotionDemoProps,
} from "../../types/constants";
import { RenderControls } from "../components/RenderControls";
import { Tips } from "../components/Tips";
import { MotionDemo } from "../remotion/MotionDemo/MotionDemo";

const Home: NextPage = () => {
  const [title, setTitle] = useState<string>(defaultMotionDemoProps.title);
  const [subtitle, setSubtitle] = useState<string>(
    defaultMotionDemoProps.subtitle,
  );

  const inputProps: z.infer<typeof MotionDemoProps> = useMemo(() => {
    return { title, subtitle };
  }, [title, subtitle]);

  return (
    <div>
      <div className="max-w-screen-md m-auto mb-5 px-4 mt-16 flex flex-col gap-10">
        <div className="overflow-hidden rounded-geist shadow-[0_0_200px_rgba(0,0,0,0.15)]">
          <Player
            component={MotionDemo}
            inputProps={inputProps}
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
        </div>
        <section className="flex flex-col gap-4">
          <RenderControls
            title={title}
            setTitle={setTitle}
            subtitle={subtitle}
            setSubtitle={setSubtitle}
            inputProps={inputProps}
          ></RenderControls>
        </section>
        <Tips></Tips>
      </div>
    </div>
  );
};

export default Home;
