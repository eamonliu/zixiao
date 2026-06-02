/**
 * Selectable fighters.
 *
 * Three planes, each named after a creature from the Classic of Mountains and
 * Seas (《山海经》). They share the same weapon/power table but differ in feel:
 *
 *   青鸾 Qīngluán — blue light fighter: nimble, high rate of fire, but light
 *                   bullets and a fragile hull (the original ship).
 *   毕方 Bìfāng   — red medium fighter: balanced across the board.
 *   穷奇 Qióngqí  — yellow heavy fighter: sluggish and slow-firing, but hits
 *                   hard, soaks damage, and carries more bombs.
 *
 * `radar` holds the 0..1 values shown on the menu's spider chart; the concrete
 * `speed / fireIntervalMs / damageMul / lives / bombs` are what actually drive
 * gameplay. The two are kept consistent by hand so the chart never lies.
 */
import { COLORS, TEX } from './config';

export type ShipId = 'qingluan' | 'bifang' | 'qiongqi';

export interface ShipRadar {
  agility: number; // 敏捷
  fireRate: number; // 射速
  power: number; // 威力
  defense: number; // 防御
  bombs: number; // 弹药
}

export interface ShipDef {
  id: ShipId;
  name: string; // 青鸾
  pinyin: string; // QINGLUAN
  klass: string; // e.g. 蓝色·轻型
  blurb: string; // one-line flavour / tip
  texture: string;
  /** Accent colour driving the radar fill and UI highlight. */
  color: number;
  colorDark: number;
  /** Tint applied to the shared player-shot sprite (and engine trail). */
  shotTint: number;
  engineTint: number[];

  // ---- Gameplay stats ----
  speed: number; // px/s normal movement
  focusSpeed: number; // px/s precision movement
  fireIntervalMs: number; // auto-fire cadence at power 1 (lower = faster)
  damageMul: number; // multiplier on player bullet damage
  lives: number; // starting / continue lives ("防御力")
  bombs: number; // starting / continue bombs

  radar: ShipRadar;
}

export const SHIPS: ShipDef[] = [
  {
    id: 'qingluan',
    name: '青鸾',
    pinyin: 'QINGLUAN',
    klass: '蓝羽·轻型',
    blurb: '机动凌厉，连射如雨；弹轻甲薄，以快制敌。',
    texture: TEX.player,
    color: COLORS.playerHull,
    colorDark: COLORS.playerHullDark,
    shotTint: 0xffffff,
    engineTint: [COLORS.playerFlame, COLORS.playerShot, 0xffffff],
    speed: 300,
    focusSpeed: 140,
    fireIntervalMs: 78,
    damageMul: 0.72,
    lives: 2,
    bombs: 2,
    radar: { agility: 1.0, fireRate: 1.0, power: 0.34, defense: 0.34, bombs: 0.66 },
  },
  {
    id: 'bifang',
    name: '毕方',
    pinyin: 'BIFANG',
    klass: '赤焰·中型',
    blurb: '攻守俱衡，无短无长；稳中取胜的全能之选。',
    texture: TEX.shipBifang,
    color: COLORS.ship2Hull,
    colorDark: COLORS.ship2HullDark,
    shotTint: 0xff9a78,
    engineTint: [0xff5d3a, 0xffc24d, 0xffffff],
    speed: 250,
    focusSpeed: 115,
    fireIntervalMs: 96,
    damageMul: 1.0,
    lives: 3,
    bombs: 2,
    radar: { agility: 0.66, fireRate: 0.66, power: 0.66, defense: 0.66, bombs: 0.66 },
  },
  {
    id: 'qiongqi',
    name: '穷奇',
    pinyin: 'QIONGQI',
    klass: '金甲·重型',
    blurb: '装甲厚重，火力凶猛；身沉手慢，宜稳步推进。',
    texture: TEX.shipQiongqi,
    color: COLORS.ship3Hull,
    colorDark: COLORS.ship3HullDark,
    shotTint: 0xffe07a,
    engineTint: [0xffae3a, 0xffe27a, 0xffffff],
    speed: 205,
    focusSpeed: 95,
    fireIntervalMs: 124,
    damageMul: 1.7,
    lives: 4,
    bombs: 3,
    radar: { agility: 0.34, fireRate: 0.34, power: 1.0, defense: 1.0, bombs: 1.0 },
  },
];

export function getShip(id: ShipId): ShipDef {
  return SHIPS.find((s) => s.id === id) ?? SHIPS[0];
}

export function shipIndex(id: ShipId): number {
  const i = SHIPS.findIndex((s) => s.id === id);
  return i < 0 ? 0 : i;
}

/** Radar axes in display order; keys map into ShipRadar. */
export const SHIP_AXES: { key: keyof ShipRadar; label: string }[] = [
  { key: 'agility', label: '敏捷' },
  { key: 'fireRate', label: '射速' },
  { key: 'power', label: '威力' },
  { key: 'defense', label: '防御' },
  { key: 'bombs', label: '弹药' },
];
