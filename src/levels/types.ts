/**
 * Level data model. A level is a time-ordered list of "cues" (spawn events)
 * followed by a boss. The small builder helpers (`at`, `row`, `burst`) keep the
 * level scripts readable.
 */
import Phaser from 'phaser';
import { BossDef } from '../entities/Boss';
import { Enemy, EnemyConfig } from '../entities/Enemy';

/** What a cue can do to the world. Provided by GameScene at update time. */
export interface LevelApi {
  spawn(cfg: EnemyConfig, x: number, y: number): Enemy | null;
  scene: Phaser.Scene;
  level: number;
}

export type CueFn = (api: LevelApi) => void;
export interface Cue {
  t: number; // ms from level start
  fn: CueFn;
}

export interface LevelDef {
  index: number;
  title: string;
  subtitle: string;
  cues: Cue[];
  boss: BossDef;
}

const SPAWN_Y = -28;

/** A single timed event. */
export const at = (t: number, fn: CueFn): Cue => ({ t, fn });

/**
 * A row of `count` enemies spread between x0..x1, each staggered by `stagger`
 * ms. `make` is a factory so every enemy gets its own fresh config.
 */
export function row(
  t: number,
  make: () => EnemyConfig,
  count: number,
  x0: number,
  x1: number,
  stagger = 170,
): Cue[] {
  const cues: Cue[] = [];
  for (let i = 0; i < count; i++) {
    const x = count === 1 ? (x0 + x1) / 2 : x0 + (x1 - x0) * (i / (count - 1));
    cues.push(at(t + i * stagger, (a) => a.spawn(make(), x, SPAWN_Y)));
  }
  return cues;
}

/** Spawn enemies at explicit x positions all at time `t`. */
export function burst(t: number, make: () => EnemyConfig, xs: number[]): Cue[] {
  return xs.map((x) => at(t, (a) => a.spawn(make(), x, SPAWN_Y)));
}
