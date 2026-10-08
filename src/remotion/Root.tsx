import { Composition, Folder } from "remotion";
import {
  MY_COMP_NAME,
  defaultMyCompProps,
  defaultMotionDemoProps,
  DURATION_IN_FRAMES,
  defaultLastSpinProps,
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
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "../../types/constants";
import { Main } from "./MyComp/Main";
import { MotionDemo } from "./MotionDemo/MotionDemo";
import { NextLogo } from "./MyComp/NextLogo";
import { LastSpin } from "./LastSpin/LastSpin";
import { RigSheet } from "./LastSpin/dev/RigSheet";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id={MY_COMP_NAME}
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
        fps={MOTION_DEMO_FPS}
        width={MOTION_DEMO_WIDTH}
        height={MOTION_DEMO_HEIGHT}
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
      <Composition
        id={LAST_SPIN_NAME}
        component={LastSpin}
        durationInFrames={LAST_SPIN_DURATION_IN_FRAMES}
        fps={LAST_SPIN_FPS}
        width={LAST_SPIN_WIDTH}
        height={LAST_SPIN_HEIGHT}
        defaultProps={defaultLastSpinProps}
      />
      <Folder name="LastSpin-dev">
        <Composition
          id="LastSpinRigSheet"
          component={RigSheet}
          durationInFrames={60}
          fps={30}
          width={1920}
          height={1080}
        />
      </Folder>
    </>
  );
};
