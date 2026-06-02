/**
 * Enemy presets. Each returns a fresh EnemyConfig (so per-instance scratch
 * params never leak between spawns). Pass a partial override to tweak, e.g.
 * `grunt({ drop: 'power' })`. Global per-level difficulty scaling (HP, bullet
 * speed, fire rate) is applied centrally in GameScene, not here.
 */
import { TEX } from '../config';
import { EnemyConfig } from '../entities/Enemy';
import * as P from '../systems/patterns';

function make(base: EnemyConfig, over: Partial<EnemyConfig>): EnemyConfig {
  return { ...base, ...over, params: { ...(base.params ?? {}), ...(over.params ?? {}) } };
}

/** Basic popcorn — drifts straight down, takes the occasional aimed pot-shot. */
export function grunt(over: Partial<EnemyConfig> = {}): EnemyConfig {
  return make(
    {
      texture: TEX.enemyGrunt,
      hp: 3,
      radius: 11,
      score: 100,
      movement: P.straightDown(120),
      fire: P.aimed(195),
      fireIntervalMs: 1500,
      fireDelayMs: 700,
      drop: 'none',
    },
    over,
  );
}

/** Weaves side to side while descending; fires aimed fans. */
export function weaver(over: Partial<EnemyConfig> = {}): EnemyConfig {
  return make(
    {
      texture: TEX.enemyWeaver,
      hp: 4,
      radius: 11,
      score: 150,
      movement: P.sineDown(90, 115, 2.3),
      fire: P.aimedFan(3, 26, 175),
      fireIntervalMs: 1700,
      fireDelayMs: 900,
      drop: 'none',
    },
    over,
  );
}

/** Camps near the top and lays down ring fire — pressure that must be killed. */
export function turret(over: Partial<EnemyConfig> = {}): EnemyConfig {
  return make(
    {
      texture: TEX.enemyTurret,
      hp: 11,
      radius: 13,
      score: 300,
      movement: P.enterAndHold(150, 75, 6500),
      fire: P.ring(10, 135),
      fireIntervalMs: 2000,
      fireDelayMs: 900,
      drop: 'none',
    },
    over,
  );
}

/** Fast vertical dive, no fire — punishes a player camping at the bottom. */
export function diver(over: Partial<EnemyConfig> = {}): EnemyConfig {
  return make(
    {
      texture: TEX.enemyDiver,
      hp: 2,
      radius: 10,
      score: 120,
      movement: P.dive(320),
      fireIntervalMs: 0,
      drop: 'none',
    },
    over,
  );
}

/** Tanky carrier that lays a slow spiral and reliably drops a power-up. */
export function carrier(over: Partial<EnemyConfig> = {}): EnemyConfig {
  return make(
    {
      texture: TEX.enemyTurret,
      hp: 26,
      radius: 16,
      score: 800,
      movement: P.enterAndHold(120, 60, 5000),
      fire: P.spiral(3, 125, 12),
      fireIntervalMs: 150,
      fireDelayMs: 1100,
      drop: 'power',
    },
    over,
  );
}
