import { LevelDef } from './types';
import { level1 } from './level1';
import { level2 } from './level2';
import { level3 } from './level3';

const BUILDERS = [level1, level2, level3];

export const LEVEL_COUNT = BUILDERS.length;

/** Build a fresh LevelDef for the given index (0..2), clamped. */
export function getLevel(index: number): LevelDef {
  const i = Math.max(0, Math.min(BUILDERS.length - 1, index));
  return BUILDERS[i]();
}
