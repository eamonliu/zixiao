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
  return {
    texture: TEX.boss2,
    name: 'AZURE LEVIATHAN',
    radius: 48,
    score: 32000,
    phases: [
      {
        hp: 240,
        fireIntervalMs: 900,
        fire: P.combine(P.aimedFan(7, 50, 175), P.ring(8, 110)),
        swaySpeed: 0.9,
        swayRange: 140,
      },
      { hp: 300, fireIntervalMs: 120, fire: P.spiral(5, 150, 9), swaySpeed: 1.2, swayRange: 150 },
      {
        hp: 360,
        fireIntervalMs: 110,
        fire: P.combine(P.spiral(3, 165, -14), P.spiral(3, 130, 14)),
        swaySpeed: 1.5,
        swayRange: 150,
      },
    ],
  };
}

export function boss3(): BossDef {
  return {
    texture: TEX.boss3,
    name: 'VIOLET SOVEREIGN',
    radius: 50,
    score: 50000,
    phases: [
      {
        hp: 300,
        fireIntervalMs: 820,
        fire: P.combine(P.aimedFan(9, 56, 185), P.ring(12, 120)),
        swaySpeed: 1.0,
        swayRange: 150,
      },
      {
        hp: 380,
        fireIntervalMs: 110,
        fire: P.combine(P.spiral(6, 165, 8), P.aimed(260)),
        swaySpeed: 1.3,
        swayRange: 155,
      },
      {
        hp: 460,
        fireIntervalMs: 95,
        fire: P.combine(P.spiral(4, 185, -13), P.spiral(4, 150, 13), P.aimedFan(3, 20, 230)),
        swaySpeed: 1.7,
        swayRange: 160,
      },
    ],
  };
}
