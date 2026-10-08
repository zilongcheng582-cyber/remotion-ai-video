import React from "react";
import { AbsoluteFill } from "remotion";
import { BEAT, STATS } from "../constants";
import { CHAR_V, clamp01, GROUND_T, lerp } from "../engine/math";
import { Bandit } from "../characters/Bandit";
import { ElPrimo, PRIMO_POSES } from "../characters/ElPrimo";
import { Shelly } from "../characters/Shelly";
import {
  AimCone,
  Bullet,
  DefeatPoof,
  DroppedCube,
  ImpactSpark,
  MuzzleFlash,
  PelletCone,
  rigPoint,
  shellyMuzzle,
  SpinMarks,
  WallDebris,
} from "../fx/Effects";
import { primoSpinPhi, reality, shellySpinPhi } from "../sim/reality";
import { DamageNumber, HealthBar, Pin, TeamRing } from "../ui/WorldUI";
import { HUD } from "../ui/HUD";
import { Arena, Drawable } from "../world/Arena";
import { SPOT } from "../world/map";

const T = GROUND_T;

const at = (x: number, y: number) => `translate(${x} ${y * T})`;

/** Screen-space projected head anchor for floating UI. */
const headAnchor = (x: number, y: number, height: number): [number, number] => [x, y * T - height * CHAR_V - 30];

export const RealityScene: React.FC<{ frame: number }> = ({ frame: f }) => {
  const s = reality(f);
  const { primo, shelly, bandit, cam } = s;
  const drawables: Drawable[] = [];
  const overlay: React.ReactNode[] = [];
  const groundFx: React.ReactNode[] = [];
  const memory = f >= BEAT.memoryStart;

  // --- Ground effects --------------------------------------------------------
  const marks = f >= BEAT.primoSpinStart + 4 ? clamp01((f - BEAT.primoSpinStart) / 30) : 0;
  const markGlow = f >= 630 && f < 720 ? Math.sin(((f - 630) / 90) * Math.PI) * 0.55 : 0;
  groundFx.push(<SpinMarks key="m1" x={SPOT.primo[0]} y={SPOT.primo[1]} amount={marks} glow={markGlow} />);
  groundFx.push(
    <SpinMarks key="m2" x={SPOT.shelly[0]} y={SPOT.shelly[1]} amount={f >= BEAT.shellySpinStart + 4 ? clamp01((f - BEAT.shellySpinStart) / 30) : 0} glow={markGlow * 0.6} />,
  );
  if (!memory && primo.visible) {
    groundFx.push(<TeamRing key="ringP" x={primo.x} y={primo.y * T} color="blue" opacity={primo.opacity * (1 - primo.fall)} />);
  }
  if (!memory && shelly.visible && shelly.x < 2300) {
    groundFx.push(<TeamRing key="ringS" x={shelly.x} y={shelly.y * T} color="red" />);
  }
  if (bandit.opacity > 0 && f < 100) {
    groundFx.push(<TeamRing key="ringB" x={bandit.x} y={bandit.y * T} color="red" opacity={bandit.opacity} />);
  }
  if (f >= BEAT.closeupEnd && f < BEAT.superFire + 2) {
    groundFx.push(
      <AimCone key="aim" x={shelly.x} y={shelly.y} dirDeg={-90} opacity={lerp(f, [452, 455], [0, 1]) * lerp(f, [461, 463], [1, 0])} />,
    );
  }

  // --- Actors -------------------------------------------------------------------
  if (bandit.opacity > 0 && f < 100) {
    drawables.push({
      y: bandit.y,
      key: "bandit",
      node: (
        <g transform={at(bandit.x, bandit.y)} opacity={bandit.opacity}>
          <Bandit uid="bandit" phi={bandit.phi} walk={bandit.walk} walkAmt={bandit.walkAmt} recoil={bandit.recoil} />
          {bandit.flash > 0 ? (
            <g opacity={bandit.flash * 0.8}>
              <Bandit uid="banditf" phi={bandit.phi} walk={bandit.walk} walkAmt={bandit.walkAmt} silhouette="#ffffff" />
            </g>
          ) : null}
        </g>
      ),
    });
  }

  if (primo.visible && !memory) {
    const fallRot = -primo.fall * 78;
    drawables.push({
      y: primo.y,
      key: "primo",
      node: (
        <g transform={at(primo.x, primo.y)} opacity={primo.opacity}>
          <g transform={`rotate(${fallRot})`}>
            <ElPrimo
              uid="primo"
              phi={primo.phi}
              arms={primo.arms}
              walk={primo.walk}
              walkAmt={primo.walkAmt}
              bob={primo.bob}
              expr={primo.expr}
              shadow={primo.fall < 0.3}
            />
            {primo.flash > 0 ? (
              <g opacity={primo.flash * 0.45}>
                <ElPrimo uid="primof" phi={primo.phi} arms={primo.arms} walk={primo.walk} walkAmt={primo.walkAmt} bob={primo.bob} silhouette="#ffffff" shadow={false} />
              </g>
            ) : null}
          </g>
        </g>
      ),
    });
  }

  if (shelly.visible && !memory && shelly.x < 2300) {
    drawables.push({
      y: shelly.y,
      key: "shelly",
      node: (
        <g transform={at(shelly.x, shelly.y)}>
          <Shelly
            uid="shelly"
            phi={shelly.phi}
            gun={shelly.gun}
            recoil={shelly.recoil}
            pump={shelly.pump}
            walk={shelly.walk}
            walkAmt={shelly.walkAmt}
            expr={shelly.expr}
            glow={shelly.glow}
          />
        </g>
      ),
    });
  }

  // --- Memory ghosts (final scene) ----------------------------------------------
  if (memory) {
    const ghostIn = lerp(f, [720, 736], [0, 1]);
    const ghostOut = lerp(f, [762, 786], [1, 0]);
    const gop = ghostIn * ghostOut;
    // replay the synchronized spin in a dreamy half speed
    const rf = 150 + (f - 720) * 0.5;
    if (gop > 0) {
      drawables.push({
        y: SPOT.primo[1],
        key: "ghostP",
        node: (
          <g transform={at(SPOT.primo[0], SPOT.primo[1])} opacity={gop * 0.62}>
            <g filter="url(#ghostBlur)" opacity={0.7}>
              <ElPrimo uid="gpg" phi={primoSpinPhi(rf)} arms={PRIMO_POSES.spin} walk={rf * 0.4} walkAmt={0.7} silhouette="#fff2d6" shadow={false} />
            </g>
            <ElPrimo uid="gp" phi={primoSpinPhi(rf)} arms={PRIMO_POSES.spin} walk={rf * 0.4} walkAmt={0.7} expr={{ eyes: "happy", mouth: "grin" }} shadow={false} />
          </g>
        ),
      });
      drawables.push({
        y: SPOT.shelly[1] + 1,
        key: "ghostS",
        node: (
          <g transform={at(SPOT.shelly[0], SPOT.shelly[1])} opacity={gop * 0.62}>
            <g filter="url(#ghostBlur)" opacity={0.7}>
              <Shelly uid="gsg" phi={shellySpinPhi(rf)} walk={rf * 0.4} walkAmt={0.7} silhouette="#fff2d6" shadow={false} />
            </g>
            <Shelly uid="gs" phi={shellySpinPhi(rf)} walk={rf * 0.4} walkAmt={0.7} expr={{ eyes: "calm", mouth: "smile" }} shadow={false} />
          </g>
        ),
      });
    }
    const hp = headAnchor(SPOT.primo[0], SPOT.primo[1], 150);
    const sat = lerp(f, [786, 808], [1, 0]);
    const pinOut = lerp(f, [806, BEAT.blackStart], [1, 0]);
    if (pinOut > 0) {
      overlay.push(
        <g key="lastPin" opacity={pinOut}>
          <Pin
            x={hp[0]}
            y={hp[1] - 64 - lerp(f, [740, 818], [0, 30])}
            kind="heart"
            start={740}
            frame={f}
            sat={sat}
            scale={1.15}
          />
        </g>,
      );
    }
  }

  // --- Skirmish projectiles --------------------------------------------------------
  const banditGun = rigPoint(bandit.x, bandit.y, bandit.phi, [-8, 74, 74]);
  const primoChest: [number, number] = [primo.x, primo.y * T - 80 * CHAR_V];
  [BEAT.banditVolley1, BEAT.banditVolley1 + 3, BEAT.banditParting, BEAT.banditParting + 3].forEach((st, i) => {
    overlay.push(<Bullet key={`b${i}`} from={banditGun} to={[primoChest[0] + (i % 2) * 8, primoChest[1] + (i % 2) * 6]} start={st} dur={8} frame={f} />);
    overlay.push(<MuzzleFlash key={`bm${i}`} x={banditGun[0]} y={banditGun[1]} angle={angleTo(banditGun, primoChest)} start={st} frame={f} />);
  });
  overlay.push(<ImpactSpark key="hit1" x={primoChest[0]} y={primoChest[1]} start={BEAT.banditHit1} frame={f} />);
  overlay.push(<ImpactSpark key="hit2" x={primoChest[0]} y={primoChest[1]} start={BEAT.banditHit2} frame={f} />);

  // Shelly -> bandit (the shot that builds her Super charge)
  if (f >= 50 && f < 70) {
    const m = shellyMuzzle(shelly.x, shelly.y, shelly.phi);
    const target: [number, number] = [bandit.x, bandit.y * T - 60 * CHAR_V];
    const ang = angleTo(m, target);
    overlay.push(<MuzzleFlash key="sm1" x={m[0]} y={m[1]} angle={ang} start={BEAT.shellyShootsBandit} frame={f} />);
    overlay.push(
      <PelletCone key="sp1" x={m[0]} y={m[1]} angle={ang} count={5} spread={9} range={dist(m, target)} start={BEAT.shellyShootsBandit} dur={6} frame={f} />,
    );
    overlay.push(<ImpactSpark key="sh1" x={target[0]} y={target[1]} start={BEAT.shellyHitsBandit} frame={f} />);
  }

  // --- Betrayal: ordinary attack, then Super ------------------------------------------
  if (f >= BEAT.bang && f < 500) {
    const m = shellyMuzzle(shelly.x, shelly.y, shelly.phi);
    const target: [number, number] = [SPOT.primo[0], SPOT.primo[1] * T - 70 * CHAR_V];
    const ang = angleTo(m, target);
    overlay.push(<MuzzleFlash key="bm" x={m[0]} y={m[1]} angle={ang} start={BEAT.bang} frame={f} />);
    overlay.push(<PelletCone key="bp" x={m[0]} y={m[1]} angle={ang} count={5} spread={10} range={dist(m, target)} start={BEAT.bang - 1} dur={2} frame={f} />);
    overlay.push(<ImpactSpark key="bi" x={target[0]} y={target[1]} start={BEAT.bang + 1} frame={f} size={1.3} />);
    overlay.push(<MuzzleFlash key="sm" x={m[0]} y={m[1]} angle={ang} start={BEAT.superFire} frame={f} big />);
    overlay.push(
      <PelletCone key="spc" x={m[0]} y={m[1]} angle={ang} count={9} spread={17} range={dist(m, target) + 120} start={BEAT.superFire} dur={4} frame={f} big />,
    );
    overlay.push(<ImpactSpark key="si" x={target[0]} y={target[1]} start={BEAT.superHit} frame={f} size={2} color="#ffe14a" />);
    if (s.wallBroken) {
      overlay.push(<WallDebris key="debris" col={10} rows={[9, 10]} start={BEAT.superHit + 1} frame={f} dirX={-1} />);
    }
  }
  overlay.push(<DefeatPoof key="poof" x={SPOT.primoKnock[0] - 30} y={SPOT.primo[1]} start={BEAT.primoPoof - 4} frame={f} />);
  overlay.push(
    <DroppedCube
      key="cube"
      x={SPOT.cube[0]}
      y={SPOT.cube[1]}
      start={BEAT.cubeDrop}
      frame={f}
      collectAt={BEAT.shellyReachCube}
      collector={[shelly.x, shelly.y]}
    />,
  );

  // --- Floating UI ----------------------------------------------------------------------
  if (!memory && primo.visible && primo.opacity > 0.05) {
    const [hx, hy] = headAnchor(primo.x, primo.y, 150);
    const prev = reality(f - 7).primo.hp;
    overlay.push(
      <HealthBar
        key="hpP"
        x={hx}
        y={hy - primo.bob}
        hp={primo.hp}
        max={STATS.primoMaxHp}
        prevHp={prev}
        color="green"
        name="PRIMO4EVER"
        ammo={3}
        frame={f}
        opacity={lerp(f, [BEAT.superHit + 6, BEAT.superHit + 14], [1, 0])}
      />,
    );
  }
  if (!memory && shelly.visible && shelly.x < 2300) {
    const [hx, hy] = headAnchor(shelly.x, shelly.y, 128);
    overlay.push(
      <HealthBar
        key="hpS"
        x={hx}
        y={hy}
        hp={shelly.hp}
        max={7200}
        color="red"
        name="shelly_x"
        superCharge={shelly.superCharge}
        superReady={f >= BEAT.superFull && f < BEAT.superFire}
        cubes={shelly.cubes + 1}
        frame={f}
      />,
    );
  }
  if (bandit.opacity > 0 && f < 100) {
    const [hx, hy] = headAnchor(bandit.x, bandit.y, 120);
    overlay.push(
      <HealthBar key="hpB" x={hx} y={hy} hp={bandit.hp} max={7400} prevHp={reality(f - 7).bandit.hp} color="red" name="??" cubes={2} frame={f} opacity={bandit.opacity} />,
    );
  }
  // damage numbers
  const [phx, phy] = headAnchor(SPOT.primo[0], SPOT.primo[1], 150);
  overlay.push(<DamageNumber key="dn1" x={phx + 30} y={phy - 30} value={STATS.banditVolley} start={BEAT.banditHit1} frame={f} />);
  overlay.push(<DamageNumber key="dn2" x={phx + 30} y={phy - 30} value={STATS.banditVolley} start={BEAT.banditHit2} frame={f} />);
  const [bhx, bhy] = headAnchor(SPOT.banditStart[0], SPOT.banditStart[1], 120);
  overlay.push(<DamageNumber key="dn3" x={bhx + 30} y={bhy - 30} value={STATS.banditDamageTaken} start={BEAT.shellyHitsBandit} frame={f} />);
  overlay.push(<DamageNumber key="dn4" x={phx + 60} y={phy - 70} value={STATS.shellyAttack} start={BEAT.bang + 1} frame={f} />);
  overlay.push(<DamageNumber key="dn5" x={phx - 60} y={phy - 100} value={STATS.shellySuper} start={BEAT.superHit} frame={f} big />);

  // Pins (only during the spin)
  if (f < 215) {
    const [px, py] = headAnchor(primo.x, primo.y, 150);
    overlay.push(<Pin key="pinP" x={px} y={py - 64} kind="heart" start={BEAT.heartPin} frame={f} end={212} />);
    const [sx, sy] = headAnchor(shelly.x, shelly.y, 128);
    overlay.push(<Pin key="pinS" x={sx} y={sy - 64} kind="happy" start={BEAT.shellyPin} frame={f} end={212} />);
  }

  // --- HUD --------------------------------------------------------------------------------
  const hudOpacity = memory ? 0 : lerp(f, [BEAT.superHit + 16, BEAT.hudGone], [1, 0]);
  const counterOpacity = lerp(f, [700, 740], [1, 0]);

  return (
    <AbsoluteFill>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          <filter id="ghostBlur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={8} />
          </filter>
        </defs>
      </svg>
      <Arena
        frame={f}
        cam={cam}
        shake={cam.shake}
        drawables={drawables}
        groundFx={groundFx}
        overlay={overlay}
        isDestroyed={(col, row) => s.wallBroken && col === 10 && (row === 9 || row === 10)}
      />
      {hudOpacity > 0 || counterOpacity > 0 ? (
        <HUD
          frame={f}
          count={s.counter}
          changedAt={BEAT.counterDrop}
          knob={primo.joy}
          joyActive={f < 420 && (primo.walkAmt > 0.2 || f >= BEAT.primoSpinStart)}
          opacity={hudOpacity}
          counterOpacity={counterOpacity}
        />
      ) : null}
    </AbsoluteFill>
  );
};

const angleTo = (a: [number, number], b: [number, number]) => (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
const dist = (a: [number, number], b: [number, number]) => Math.hypot(b[0] - a[0], b[1] - a[1]);
