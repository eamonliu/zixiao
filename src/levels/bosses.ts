/**
 * Boss definitions, one per level. Three phases each, escalating from readable
 * aimed fire to dense spirals. HP is tuned so a moderately-powered player needs
 * ~25–40s per boss.
 */
import { TEX } from '../config';
import { BossDef } from '../entities/Boss';
import * as P from '../systems/patterns';

export function boss1(): BossDef {
  return {
    texture: TEX.boss1,
    name: 'CRIMSON WARDEN',
    radius: 46,
    score: 20000,
    phases: [
      { hp: 170, fireIntervalMs: 1150, fire: P.aimedFan(5, 42, 165), swaySpeed: 0.7, swayRange: 120 },
      {
        hp: 210,
        fireIntervalMs: 950,
        fire: P.combine(P.ring(14, 130), P.aimed(225)),
        swaySpeed: 1.0,
        swayRange: 130,
      },
      { hp: 250, fireIntervalMs: 130, fire: P.spiral(4, 150, 11), swaySpeed: 1.3, swayRange: 140 },
    ],
  };
}

export function boss2(): BossDef {
  // Tuned to level-1 boss intensity (on par with CRIMSON WARDEN), keeping its
  // spiral identity but with fewer bullets, slower fire and lower HP.
  return {
    texture: TEX.boss2,
    name: 'AZURE LEVIATHAN',
    radius: 48,
    score: 32000,
    phases: [
      {
        hp: 175,
        fireIntervalMs: 1100,
        fire: P.combine(P.aimedFan(5, 46, 165), P.ring(8, 115)),
        swaySpeed: 0.8,
        swayRange: 130,
      },
      { hp: 210, fireIntervalMs: 150, fire: P.spiral(4, 150, 10), swaySpeed: 1.1, swayRange: 140 },
      {
        hp: 250,
        fireIntervalMs: 140,
        fire: P.combine(P.spiral(3, 150, -11), P.spiral(3, 130, 11)),
        swaySpeed: 1.3,
        swayRange: 145,
      },
    ],
  };
}

export function boss3(): BossDef {
  // Brought down to level-1 boss intensity (on par with CRIMSON WARDEN): the
  // dense dual-spiral finale keeps its shape but with far fewer bullets, slower
  // fire and much lower HP so it is no harder than stage 1.
  return {
    texture: TEX.boss3,
    name: 'VIOLET SOVEREIGN',
    radius: 50,
    score: 50000,
    phases: [
      {
        hp: 180,
        fireIntervalMs: 1050,
        fire: P.combine(P.aimedFan(5, 50, 170), P.ring(10, 120)),
        swaySpeed: 0.9,
        swayRange: 135,
      },
      {
        hp: 220,
        fireIntervalMs: 150,
        fire: P.combine(P.spiral(4, 160, 8), P.aimed(230)),
        swaySpeed: 1.2,
        swayRange: 145,
      },
      {
        hp: 250,
        fireIntervalMs: 140,
        fire: P.combine(P.spiral(3, 170, -12), P.spiral(3, 150, 12)),
        swaySpeed: 1.4,
        swayRange: 150,
      },
    ],
  };
}
