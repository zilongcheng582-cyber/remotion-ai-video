import { Composition } from "remotion";
import {
  COMP_NAME,
  defaultMyCompProps,
  defaultMotionDemoProps,
  DURATION_IN_FRAMES,
  MOTION_DEMO_DURATION_IN_FRAMES,
  MOTION_DEMO_NAME,
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "../../types/constants";
import { Main } from "./MyComp/Main";
import { MotionDemo } from "./MotionDemo/MotionDemo";
import { NextLogo } from "./MyComp/NextLogo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id={COMP_NAME}
        component={Main}
        durationInFrames={DURATION_IN_FRAMES}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        defaultProps={defaultMyCompProps}
      />
      <Composition
        id={MOTION_DEMO_NAME}
        component={MotionDemo}
        durationInFrames={MOTION_DEMO_DURATION_IN_FRAMES}
        fps={VIDEO_FPS}
        width={1920}
        height={1080}
        defaultProps={defaultMotionDemoProps}
      />
      <Composition
        id="NextLogo"
        component={NextLogo}
        durationInFrames={300}
        fps={30}
        width={140}
        height={140}
        defaultProps={{
          outProgress: 0,
        }}
      />
    </>
  );
};
