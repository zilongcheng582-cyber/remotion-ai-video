import React from "react";
import { Composition } from "remotion";
import {
  defaultLastSpinProps,
  LAST_SPIN_DURATION_IN_FRAMES,
  LAST_SPIN_FPS,
  LAST_SPIN_HEIGHT,
  LAST_SPIN_NAME,
  LAST_SPIN_WIDTH,
} from "../../../../types/constants";
import { LastSpin } from "../LastSpin";
import { RigSheet } from "./RigSheet";

// Same LastSpin registration as the main Root, without the other template
// compositions (one of which fetches Google Fonts at import time).
export const LastSpinRoot: React.FC = () => {
  return (
    <>
      <Composition
        id={LAST_SPIN_NAME}
        component={LastSpin}
        durationInFrames={LAST_SPIN_DURATION_IN_FRAMES}
        fps={LAST_SPIN_FPS}
        width={LAST_SPIN_WIDTH}
        height={LAST_SPIN_HEIGHT}
        defaultProps={defaultLastSpinProps}
      />
      <Composition
        id="LastSpinRigSheet"
        component={RigSheet}
        durationInFrames={60}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
