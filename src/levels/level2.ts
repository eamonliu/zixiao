import { LevelDef, Cue, at, row, burst } from './types';
import * as E from './enemies';
import { boss2 } from './bosses';

const L = 60;
const R = 420;
const MID = 240;

/** Level 2 — denser formations, more turrets/carriers, tighter timing. */
export function level2(): LevelDef {
  const cues: Cue[] = [
    ...row(1200, E.grunt, 6, L, R, 150),
    ...burst(3500, E.weaver, [L + 20, MID, R - 20]),
    ...row(5500, E.grunt, 6, R, L, 130),

    ...burst(8000, E.turret, [150, 330]),
    ...burst(9000, () => E.diver(), [120, 240, 360]),
    ...row(11000, E.weaver, 5, L, R, 150),

    ...burst(14000, E.carrier, [150, 330]),
    ...row(15500, E.grunt, 7, L, R, 110),

    ...burst(19000, () => E.diver(), [80, 180, 280, 380]),
    ...burst(21000, E.turret, [120, 240, 360]),
    ...row(23000, E.weaver, 6, R, L, 140),

    ...row(27000, E.grunt, 8, L, R, 100),
    ...burst(30000, E.weaver, [100, 200, 300, 400]),
    ...burst(33000, () => E.diver(), [110, 200, 290, 380]),

    ...burst(36000, () => E.turret({ drop: 'bomb' }), [MID]),
    ...burst(37000, E.turret, [110, 370]),
    ...row(39000, E.grunt, 8, L, R, 95),

    ...burst(43000, E.carrier, [120, 360]),
    ...row(44500, E.weaver, 6, L, R, 150),
    ...burst(48000, () => E.diver(), [90, 170, 250, 330, 410]),

    ...burst(51000, E.turret, [120, 240, 360]),
    ...row(53000, E.grunt, 9, R, L, 90),

    ...row(58000, E.weaver, 7, L, R, 130),
    ...burst(61500, E.carrier, [150, 330]),
    ...burst(64000, () => E.diver(), [100, 200, 300, 400]),

    ...burst(67000, E.turret, [90, 240, 390]),
    ...row(69000, E.grunt, 9, L, R, 85),

    // Pre-boss crescendo.
    ...row(73000, E.weaver, 8, R, L, 110),
    ...burst(76500, () => E.diver(), [80, 160, 240, 320, 400]),
    ...burst(79000, E.carrier, [120, 240, 360]),
    ...row(81000, E.grunt, 10, L, R, 80),
    ...burst(84000, E.turret, [150, 330]),

    at(88000, () => {
      /* breather */
    }),
  ];

  return {
    index: 1,
    title: 'STAGE 2',
    subtitle: 'ION STORM',
    cues,
    boss: boss2(),
  };
}
