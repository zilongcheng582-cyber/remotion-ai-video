# The Last Spin

A 28-second, wordless, unofficial Brawl Stars-inspired fan short, made as the
Remotion composition `LastSpin` (1920×1080, 30 fps, 840 frames, with sound).

> El Primo thinks a legendary friendship has begun. Shelly thinks she has
> found an easy opportunity.

## Watch / preview

- **Web app:** `npm run dev` → choose **LastSpin (28s film)** above the Player
  and unmute it. **Render Video** sends `{ id: "LastSpin" }` through the
  existing Vercel Sandbox + Blob (OIDC) pipeline.
- **Studio:** `npx remotion studio` → `LastSpin`. The `LastSpin-dev` folder has
  a character turnaround sheet.
- **Offline render** (no Google Fonts fetch; registers only LastSpin):
  ```bash
  npx remotion render src/remotion/LastSpin/dev/index.ts LastSpin out/LastSpin.mp4
  ```
- **Keyframes for the art quality gate:**
  ```bash
  node scripts/last-spin/keyframes.mjs out/keyframes        # 14 named frames
  node scripts/last-spin/keyframes.mjs out/kf 120,421,465 1 # custom frames, full res
  ```
  (Set `REMOTION_BROWSER` if Chrome is not auto-detected.)

## Storyboard and frame sheet

All timing lives in `src/remotion/LastSpin/constants.ts` (`SCENES`, `BEAT`).

| Time | Frames | Scene | What happens |
| --- | --- | --- | --- |
| 0–3 s | 0–89 | Encounter | 10 brawlers left. A rival bandit hits El Primo twice (13,000 → 8,400). Shelly arrives, blasts the bandit (her Super goes from 42% to 60%), and he flees into a bush. Standoff. |
| 3–7 s | 90–209 | First spin | Shelly spins. El Primo is surprised, hesitates, then spins in sync. Heart Pin, then Shelly's smiley Pin. Time slows, warm grade, camera pushes in, and the spin becomes a vortex. |
| 7–10 s | 210–299 | Fantasy A | Seaside best friends: jellyfish nets, flower clouds, a starfish, a bear hug. |
| 10–12 s | 300–359 | Fantasy B | Dusk flight with head propellers over a quiet town and an empty lot with three pipes. El Primo's propeller sputters and Shelly catches his hand. |
| 12–14 s | 360–419 | Fantasy C | Legendary partners: cover fire, his flaming leap, then a sunset where they reach for a high-five… |
| 14 s | 420 | **BANG** | Hard cut. A point-blank shotgun attack: 8,400 → 5,400. El Primo freezes. |
| 14.7 s | 440–451 | Super ready | Close-up: the ring completes and the button lights up yellow. |
| 15.4 s | 462 | Super | Nine-pellet cone, knockback, the wall behind him shatters, HP → 0, music cut, counter 10 → 9. |
| 17–24 s | 510–719 | Indifference | El Primo vanishes and a power cube drops. Shelly walks over, takes it, and leaves without a Pin or gesture. The camera stays on the empty spot, colors drained, and sparse piano plays. |
| 24–28 s | 720–839 | Last memory | A ghost replay of the synchronized spin. The heart Pin stays alone, loses its color and fades. Black. |

## Architecture

```
src/remotion/LastSpin/
  LastSpin.tsx          composition: scene sequences, color grade, fades
  constants.ts          frame sheet + gameplay numbers
  sim/reality.ts        deterministic match simulation (positions, facing,
                        HP, Super charge, game-time dilation, camera)
  engine/rig.tsx        2.5D rig: parts in 3D local space -> projected,
                        depth-sorted SVG (continuous rotation for spinning)
  characters/           ElPrimo, Shelly, Bandit rigs (poses + expressions)
  world/                map (ASCII layout), Arena (depth-sorted props), Props
  ui/                   HUD (counter, joystick, buttons), health bars, Pins
  fx/                   bullets, pellet cones, muzzle flash, wall debris,
                        defeat poof, power cube, spin marks, aim cone, vortex
  scenes/               RealityScene (any reality frame), SuperCloseup
  fantasy/              Seaside, Dusk, Legends + shared props
  audio/                cue sheet + Soundtrack (@remotion/media <Audio>)
  dev/                  offline entry point + rig turnaround sheet
scripts/last-spin/      generate-audio.mjs (original score/SFX), keyframes.mjs
```

All animation is driven by `useCurrentFrame()`. There are no CSS animations,
and randomness is seeded.

## Assets and rights

See [`public/last-spin/ASSET_MANIFEST.md`](../../public/last-spin/ASSET_MANIFEST.md).
