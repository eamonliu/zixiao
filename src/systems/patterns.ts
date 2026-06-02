/**
 * Reusable movement and fire patterns. Each exported factory returns a function
 * matching MovementFn / FireFn so level data can compose enemies declaratively,
 * e.g. `{ movement: sineDown(70, 90, 2.2), fire: aimedFan(3, 18, 200) }`.
 *
 * Angle convention: radians, 0 = +x (right), +PI/2 = +y (down, toward player).
 */
import { COLORS, GAME_WIDTH, TEX } from '../config';
import { BattleContext, Combatant, FireFn, MovementFn } from '../entities/Enemy';

// ---- low-level shoot helper ----------------------------------------------

type ShotStyle = 'round' | 'aimed' | 'big';

function shoot(
  ctx: BattleContext,
  x: number,
  y: number,
  angle: number,
  speed: number,
  style: ShotStyle = 'round',
): void {
  const s = speed * ctx.bulletSpeedMul;
  const tex =
    style === 'aimed' ? TEX.enemyShotAimed : style === 'big' ? TEX.enemyShotBig : TEX.enemyShot;
  const radius = style === 'big' ? 8 : style === 'aimed' ? 4 : 5;
  ctx.enemyBullets.spawn(x, y, {
    vx: Math.cos(angle) * s,
    vy: Math.sin(angle) * s,
    texture: tex,
    radius,
    orient: style === 'aimed',
  });
}

function angleToPlayer(e: Combatant, ctx: BattleContext): number {
  return Math.atan2(ctx.playerY - e.y, ctx.playerX - e.x);
}

// ---- movement -------------------------------------------------------------

/** Straight down at a constant speed. */
export function straightDown(speed: number): MovementFn {
  return (e) => {
    e.vx = 0;
    e.vy = speed;
  };
}

/** Drift diagonally (px/s each axis). */
export function drift(vx: number, vy: number): MovementFn {
  return (e) => {
    e.vx = vx;
    e.vy = vy;
  };
}

/** Descend while weaving horizontally (sine). */
export function sineDown(speed: number, amp: number, freq: number): MovementFn {
  return (e, age) => {
    e.vy = speed;
    e.vx = Math.cos((age / 1000) * freq) * amp;
  };
}

/** Fast straight dive — for "diver" enemies. */
export function dive(speed: number): MovementFn {
  return (e) => {
    e.vx = 0;
    e.vy = speed;
  };
}

/**
 * Enter from the top, stop at a hold line and camp there (turrets), then leave
 * downward after `holdMs`. Uses e.params as a tiny 3-phase state machine.
 */
export function enterAndHold(holdY: number, speed: number, holdMs: number): MovementFn {
  return (e, age) => {
    const phase = e.params.phase ?? 0;
    if (phase === 0) {
      e.vx = 0;
      e.vy = speed;
      if (e.y >= holdY) {
        e.y = holdY;
        e.params.phase = 1;
        e.params.holdEnd = age + holdMs;
      }
    } else if (phase === 1) {
      e.vx = 0;
      e.vy = 0;
      if (age >= (e.params.holdEnd ?? 0)) e.params.phase = 2;
    } else {
      e.vx = 0;
      e.vy = speed * 0.8;
    }
  };
}

/** Swoop in from one side in a wide arc and exit the other side. */
export function swoop(speed: number, fromLeft: boolean): MovementFn {
  return (e, age) => {
    const t = age / 1000;
    e.vx = (fromLeft ? 1 : -1) * speed * 0.8;
    e.vy = Math.sin(t * 1.6) * speed * 0.6 + speed * 0.25;
  };
}

// ---- fire -----------------------------------------------------------------

/** Single shot aimed at the player. */
export function aimed(speed: number): FireFn {
  return (e, ctx) => shoot(ctx, e.x, e.y, angleToPlayer(e, ctx), speed, 'aimed');
}

/** A fan of `count` bullets spanning `spreadDeg`, centred on the player. */
export function aimedFan(count: number, spreadDeg: number, speed: number): FireFn {
  return (e, ctx) => {
    const base = angleToPlayer(e, ctx);
    const spread = (spreadDeg * Math.PI) / 180;
    const start = base - spread / 2;
    const step = count > 1 ? spread / (count - 1) : 0;
    for (let i = 0; i < count; i++) shoot(ctx, e.x, e.y, start + step * i, speed, 'aimed');
  };
}

/** A full ring of `count` bullets. */
export function ring(count: number, speed: number, phase = 0): FireFn {
  return (e, ctx) => {
    for (let i = 0; i < count; i++) {
      shoot(ctx, e.x, e.y, phase + (i / count) * Math.PI * 2, speed, 'round');
    }
  };
}

/** A rotating spiral — each call emits `arms` bullets and advances the angle. */
export function spiral(arms: number, speed: number, stepDeg: number): FireFn {
  const step = (stepDeg * Math.PI) / 180;
  return (e, ctx) => {
    const a0 = (e.params.spiral = (e.params.spiral ?? 0) + step);
    for (let i = 0; i < arms; i++) {
      shoot(ctx, e.x, e.y, a0 + (i / arms) * Math.PI * 2, speed, 'round');
    }
  };
}

/** Aimed downward burst, slightly randomised — chaotic "popcorn" pressure. */
export function aimedBurst(count: number, speed: number, jitterDeg: number): FireFn {
  return (e, ctx) => {
    const base = angleToPlayer(e, ctx);
    for (let i = 0; i < count; i++) {
      const j = ((Math.random() - 0.5) * jitterDeg * Math.PI) / 180;
      shoot(ctx, e.x, e.y, base + j, speed, 'round');
    }
  };
}

/** Combine two fire patterns into one. */
export function combine(...fns: FireFn[]): FireFn {
  return (e, ctx) => fns.forEach((f) => f(e, ctx));
}

// A couple of shared constants other modules may want.
export const SCREEN_MID_X = GAME_WIDTH / 2;
export const ENEMY_BULLET_COLOR = COLORS.enemyShot;
