import { LevelDef, Cue, at, row, burst } from './types';
import * as E from './enemies';
import { boss1 } from './bosses';

const L = 60;
const R = 420;
const MID = 240;

/** Level 1 — a gentle on-ramp that teaches movement, dodging and graze. */
export function level1(): LevelDef {
  const cues: Cue[] = [
    // Warm-up grunt sweeps.
    ...row(1500, E.grunt, 4, L, R, 200),
    ...row(4200, E.grunt, 4, R, L, 200),

    // First weavers from the edges.
    ...burst(7000, E.weaver, [L + 30, R - 30]),
    ...row(9000, E.grunt, 5, L, R, 150),

    // Divers punish bottom-camping.
    ...burst(12000, () => E.diver(), [160, 320]),
    ...row(14000, E.weaver, 3, 120, 360, 260),

    // First turret — must be cleared to relieve ring pressure.
    ...burst(17500, E.turret, [MID]),
    ...row(18500, E.grunt, 4, L, R, 180),

    // Power carrier with grunt escort.
    ...burst(22000, E.carrier, [MID]),
    ...row(23000, E.grunt, 4, L + 40, R - 40, 160),

    ...row(27000, E.grunt, 6, R, L, 130),
    ...burst(30000, E.weaver, [120, 240, 360]),
    ...burst(33000, () => E.diver(), [120, 240, 360]),

    // Twin turrets.
    ...burst(36500, E.turret, [150, 330]),
    ...row(38000, E.grunt, 5, L, R, 150),

    ...row(42000, E.weaver, 4, L, R, 220),
    ...burst(45500, () => E.diver(), [100, 200, 300, 400]),
    ...row(48000, E.grunt, 6, L, R, 120),

    // Bomb drop from a lone turret.
    ...burst(51500, () => E.turret({ drop: 'bomb' }), [MID]),
    ...row(53000, E.weaver, 3, 120, 360, 240),

    ...row(57000, E.grunt, 7, L, R, 110),
    ...burst(60500, E.carrier, [150, 330]),

    ...row(64000, E.weaver, 5, R, L, 170),
    ...burst(67500, () => E.diver(), [80, 180, 280, 380]),
    ...burst(70000, E.turret, [120, 240, 360]),

    // Pre-boss crescendo.
    ...row(74000, E.grunt, 8, L, R, 100),
    ...row(77000, E.weaver, 5, L, R, 160),
    ...burst(80000, () => E.diver(), [120, 200, 280, 360]),
    ...burst(82500, E.carrier, [MID]),
    ...row(84000, E.grunt, 6, L, R, 120),

    at(88000, () => {
      /* breather before the boss */
    }),
  ];

  return {
    index: 0,
    title: 'STAGE 1',
    subtitle: 'ORBITAL APPROACH',
    cues,
    boss: boss1(),
  };
}
