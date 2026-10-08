import { z } from "zod";

// --- MotionDemo (default composition) ---
export const MOTION_DEMO_NAME = "MotionDemo";
export const MOTION_DEMO_DURATION_IN_FRAMES = 300;
export const MOTION_DEMO_FPS = 30;
export const MOTION_DEMO_WIDTH = 1920;
export const MOTION_DEMO_HEIGHT = 1080;

export const MotionDemoProps = z.object({
  title: z.string(),
  subtitle: z.string(),
});

export const defaultMotionDemoProps: z.infer<typeof MotionDemoProps> = {
  title: "Motion Graphics",
  subtitle: "Programmatic video with Remotion",
};

// --- LastSpin (Brawl Stars-inspired fan short, 28 s) ---
export const LAST_SPIN_NAME = "LastSpin";
export const LAST_SPIN_DURATION_IN_FRAMES = 840;
export const LAST_SPIN_FPS = 30;
export const LAST_SPIN_WIDTH = 1920;
export const LAST_SPIN_HEIGHT = 1080;

// The film is fully authored; it takes no editable input props.
export const LastSpinProps = z.object({});
export const defaultLastSpinProps: z.infer<typeof LastSpinProps> = {};

// --- MyComp (original template composition, kept as a secondary composition) ---
export const MY_COMP_NAME = "MyComp";

export const MyCompProps = z.object({
  title: z.string(),
});

export const defaultMyCompProps: z.infer<typeof MyCompProps> = {
  title: "Vercel and Remotion",
};

export const DURATION_IN_FRAMES = 200;
export const VIDEO_WIDTH = 1280;
export const VIDEO_HEIGHT = 720;
export const VIDEO_FPS = 30;

// --- Defaults used by the web app (Player + render API) ---
export const COMP_NAME = MOTION_DEMO_NAME;
export const CompositionProps = MotionDemoProps;
