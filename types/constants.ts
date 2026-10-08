import { z } from "zod";
export const COMP_NAME = "MyComp";

export const CompositionProps = z.object({
  title: z.string(),
});

export const defaultMyCompProps: z.infer<typeof CompositionProps> = {
  title: "Vercel and Remotion",
};

export const DURATION_IN_FRAMES = 200;
export const VIDEO_WIDTH = 1280;
export const VIDEO_HEIGHT = 720;
export const VIDEO_FPS = 30;

export const MOTION_DEMO_NAME = "MotionDemo";
export const MOTION_DEMO_DURATION_IN_FRAMES = 300;

export const MotionDemoProps = z.object({
  title: z.string(),
  subtitle: z.string(),
});

export const defaultMotionDemoProps: z.infer<typeof MotionDemoProps> = {
  title: "Motion Graphics",
  subtitle: "Programmatic video with Remotion",
};
