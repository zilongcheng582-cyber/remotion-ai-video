import { z } from "zod";
import {
  LAST_SPIN_NAME,
  LastSpinProps,
  MOTION_DEMO_NAME,
  MotionDemoProps,
  MY_COMP_NAME,
  MyCompProps,
} from "./constants";

export const RenderRequest = z.discriminatedUnion("id", [
  z.object({ id: z.literal(MOTION_DEMO_NAME), inputProps: MotionDemoProps }),
  z.object({ id: z.literal(MY_COMP_NAME), inputProps: MyCompProps }),
  z.object({ id: z.literal(LAST_SPIN_NAME), inputProps: LastSpinProps }),
]);

export type RenderResponse =
  | {
      type: "error";
      message: string;
    }
  | {
      type: "done";
      url: string;
      size: number;
    };

export type SSEMessage =
  | { type: "phase"; phase: string; progress: number; subtitle?: string }
  | { type: "done"; url: string; size: number }
  | { type: "error"; message: string };
