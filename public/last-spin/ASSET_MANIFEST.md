# The Last Spin — asset manifest

Unofficial fan project. Not affiliated with, endorsed, sponsored or approved by
Supercell. Brawl Stars, El Primo and Shelly are trademarks/characters of
Supercell Oy. The fantasy sequences contain *symbolic* homages to classic
cartoon friendships (an undersea best-friend duo; a childhood friendship with
a helpful companion). No characters, designs, logos, music or footage from
those works are reproduced. Their rights remain with their respective owners.

## Provenance of every shipped asset

| Asset | Location | Origin | License / status |
| --- | --- | --- | --- |
| El Primo-inspired character rig | `src/remotion/LastSpin/characters/ElPrimo.tsx` | Original vector drawing written in code for this project. Styled after a user-supplied El Primo reference image (image A) used only for visual study. | Original code. Character likeness belongs to Supercell; fan use only. |
| Shelly-inspired character rig | `src/remotion/LastSpin/characters/Shelly.tsx` | Original code, styled after a user-supplied Shelly reference image (image B). | As above. |
| Rival "bandit" brawler | `src/remotion/LastSpin/characters/Bandit.tsx` | Original design for this film. | Original. |
| Pins (heart-eyes El Primo, happy Shelly) | `src/remotion/LastSpin/ui/WorldUI.tsx` | Original vector drawings in the flat, thick-outline style of user-supplied Pin references (images C, D). | Original drawing; Pin concept/likeness belongs to Supercell. |
| Arena: sand, walls, golden bushes, crates, barrels, cacti | `src/remotion/LastSpin/world/*` | Original procedural vector art. The layout and colors are matched to a user-supplied Solo Showdown gameplay screenshot (image E). | Original. |
| HUD (Brawlers-left counter, joystick, attack/Super buttons, health bars) | `src/remotion/LastSpin/ui/*`, `scenes/SuperCloseup.tsx` | Original vector recreations of the game's UI conventions. | Original drawing; UI conventions belong to Supercell. |
| Fantasy scenes | `src/remotion/LastSpin/fantasy/*` | Original backgrounds and props (flower-shaped clouds, jellyfish nets, starfish, head propellers, three concrete pipes, sunset mesa). | Original. Symbolic homage only. |
| Music (3 stems) | `public/last-spin/audio/music-*.wav` | Synthesized from scratch by `scripts/last-spin/generate-audio.mjs` (original compositions). | Original; free to use with this project. |
| Sound effects (20 files) | `public/last-spin/audio/sfx-*.wav` | Synthesized by the same script. | Original. |
| Lilita One font | `public/last-spin/fonts/LilitaOne.woff2` | `@fontsource/lilita-one` 5.3.0 (npm), designed by Juan Montoreano. | SIL Open Font License 1.1 (`OFL-LilitaOne.txt`). |

## What was **not** used

- No official Supercell artwork, 3D models, sprites, UI textures, sound effects
  or music are included. The five reference images were shared in the chat for
  visual study only. They are not stored in this repository.
- No third-party cartoon artwork, characters, audio or footage.

## Verification caveats

- The official references listed in the production brief could not be reached
  from the build environment: supercell.com, make.supercell.com, the Brawl Stars
  fandom wiki and stat databases were blocked by the network policy. Visual
  matching therefore relies on the five user-supplied images.
- Gameplay numbers are the brief's Power Level 11 working values. They are
  internally consistent with the usual 2x L1-to-L11 scaling, but this session
  did not check them against live balance data:
  El Primo 13,000 HP; Shelly attack 5 x 600 = 3,000; Shelly Super 9 x 640 =
  5,760; a point-blank attack is about +50% Super charge; health regeneration
  starts after about 3 s without damage.
- Story check: 8,400 - 3,000 = 5,400 < 5,760, so the Super is lethal only if
  all nine pellets connect at point blank (as shown). Super charge goes from
  60% to 100%. El Primo's last damage happens about 2.8 s of game time before
  the betrayal shot (computed in `sim/reality.ts`), so he never starts to
  regenerate.

## Replacing assets

- **Audio:** drop a replacement WAV/MP3 into `public/last-spin/audio/` with the
  same file name, or point a cue at a new file in
  `src/remotion/LastSpin/audio/cues.ts`. Cue timings are tied to the frame
  sheet in `src/remotion/LastSpin/constants.ts`. To regenerate the originals,
  run `node scripts/last-spin/generate-audio.mjs`.
- **Characters:** to swap in licensed artwork, replace the rig components and
  keep their props (`phi`, pose, expression). Every scene calls them through
  those props.
