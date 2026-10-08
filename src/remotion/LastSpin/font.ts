import { useState } from "react";
import { cancelRender, continueRender, delayRender, staticFile } from "remotion";

// Lilita One (SIL OFL 1.1, bundled in public/last-spin/fonts) gives the HUD its
// chunky game-UI lettering without any network font request at render time.
let loaded: Promise<void> | null = null;

const loadLilita = () => {
  if (loaded) return loaded;
  if (typeof window === "undefined" || typeof FontFace === "undefined") {
    return Promise.resolve();
  }
  const face = new FontFace("LilitaOne", `url(${staticFile("last-spin/fonts/LilitaOne.woff2")}) format("woff2")`);
  loaded = face.load().then((f) => {
    document.fonts.add(f);
  });
  return loaded;
};

export const useLastSpinFont = () => {
  useState(() => {
    if (typeof window === "undefined") return null;
    const handle = delayRender("Loading LastSpin font");
    loadLilita()
      .then(() => continueRender(handle))
      .catch((err) => cancelRender(err));
    return handle;
  });
};
