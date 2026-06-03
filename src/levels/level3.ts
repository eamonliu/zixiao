import { LevelDef, Cue, at, row, burst } from './types';
import * as E from './enemies';
import { boss3 } from './bosses';

const L = 55;
const R = 425;

/** Level 3 — layered formations & frequent divers, but tuned to level-1 threat
 *  (bullet speed, fire rate, enemy HP and boss intensity all on par with stage 1). */
export function level3(): LevelDef {
  const cues: Cue[] = [
    ...row(1000, E.grunt, 8, L, R, 110),
    ...burst(2800, E.turret, [120, 240, 360]),
    ...burst(4000, () => E.diver(), [120, 240, 360]),

    ...row(6000, E.weaver, 7, R, L, 120),
    ...burst(9000, E.carrier, [120, 240, 360]),
    ...burst(11000, () => E.diver(), [80, 180, 280, 380]),

    ...row(13000, E.grunt, 9, L, R, 90),
    ...burst(16000, E.turret, [110, 240, 370]),
    ...row(18000, E.weaver, 8, L, R, 110),

    ...burst(21500, () => E.diver(), [90, 170, 250, 330, 410]),
    ...burst(24000, E.carrier, [120, 360]),
    ...row(25500, E.grunt, 10, R, L, 80),

    ...burst(29000, () => E.turret({ drop: 'bomb' }), [150, 330]),
    ...burst(30000, E.turret, [60, 240, 420]),
    ...row(32000, E.weaver, 9, L, R, 95),

    ...burst(36000, () => E.diver(), [80, 160, 240, 320, 400]),
    ...burst(38000, () => E.diver(), [120, 200, 280, 360]),
    ...row(40000, E.grunt, 11, L, R, 75),

    ...burst(44000, E.carrier, [110, 240, 370]),
    ...row(46000, E.weaver, 9, R, L, 95),
    ...burst(49500, E.turret, [110, 240, 370]),

    ...burst(53000, () => E.diver(), [70, 150, 230, 310, 390]),
    ...row(55000, E.grunt, 11, L, R, 70),
    ...burst(59000, E.turret, [90, 180, 300, 390]),

    ...row(62000, E.weaver, 10, L, R, 85),
    ...burst(65500, E.carrier, [120, 240, 360]),
    ...burst(68000, () => E.diver(), [80, 160, 240, 320, 400]),

    // Pre-boss onslaught.
    ...row(71000, E.grunt, 12, R, L, 65),
    ...burst(74500, E.turret, [90, 240, 390]),
    ...row(77000, E.weaver, 10, L, R, 80),
    ...burst(80000, () => E.diver(), [70, 140, 210, 280, 350, 420]),
    ...burst(83000, E.carrier, [120, 240, 360]),

    at(87000, () => {
      /* breather */
    }),
  ];

  return {
    index: 2,
    title: 'STAGE 3',
    subtitle: 'SOVEREIGN GATE',
    cues,
    boss: boss3(),
  };
}
