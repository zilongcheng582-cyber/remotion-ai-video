// Offline entry point for local previews/renders of LastSpin only.
// The main entry (src/remotion/index.ts) also registers MyComp, which fetches
// Google Fonts at import time; this entry avoids that network dependency.
import { registerRoot } from "remotion";
import { LastSpinRoot } from "./LastSpinRoot";

registerRoot(LastSpinRoot);
