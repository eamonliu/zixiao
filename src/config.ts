/**
 * Global configuration & tuning knobs.
 *
 * This is the single source of truth for the game's "feel". Almost every
 * gameplay number lives here so the design can be re-balanced without hunting
 * through the entity code. The defaults aim at the brief: a hard-but-fair
 * arcade 1CC shmup that is still *fun* — generous hitbox grace, respawn in
 * place, readable bullets.
 */

/** Internal render resolution. The playfield is portrait (2:3), classic TATE. */
export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 720;

/** Logical bounds the player ship is allowed to roam within. */
export const PLAY_BOUNDS = {
  left: 14,
  right: GAME_WIDTH - 14,
  top: 24,
  bottom: GAME_HEIGHT - 18,
};

/** Pixel-art palette. Kept small and cohesive (a cool sci-fi spectrum). */
export const COLORS = {
  bg0: 0x05060f,
  bg1: 0x0a1330,
  bg2: 0x132257,
  star: 0x9fe9ff,
  white: 0xffffff,

  // Player — 青鸾 (blue light fighter, the default)
  playerHull: 0x8fe7ff,
  playerHullDark: 0x2f7fb8,
  playerCockpit: 0xfff3b0,
  playerFlame: 0xff7b3d,
  playerShot: 0xbff4ff,
  playerShotCore: 0xffffff,

  // 毕方 (red medium fighter)
  ship2Hull: 0xff6f5c,
  ship2HullDark: 0x9c2f2a,
  // 穷奇 (yellow heavy fighter)
  ship3Hull: 0xffd24d,
  ship3HullDark: 0xa6791a,

  // Enemies
  enemyA: 0xff5d73, // grunt
  enemyADark: 0x8c2740,
  enemyB: 0xffd166, // weaver
  enemyBDark: 0x9c6f1f,
  enemyC: 0xb892ff, // turret
  enemyCDark: 0x5a3aa6,
  enemyShot: 0xff8bd0,
  enemyShotCore: 0xffe3f4,
  enemyShotAimed: 0xff5252,

  // Boss
  boss: 0xc0c8ff,
  bossDark: 0x47508f,
  bossCore: 0xff4d6d,

  // FX & pickups
  powerUp: 0x5dff9b,
  bombPickup: 0xffe14d,
  graze: 0xfff7a8,
  explosion: 0xffd07a,
  hudCyan: 0x9fe9ff,
  hudPink: 0xff8bd0,
} as const;

export const PLAYER = {
  startLives: 3,
  maxLives: 6,
  startBombs: 2,
  maxBombs: 6,
  startContinues: 2,

  speed: 250, // px/s, normal movement
  focusSpeed: 115, // px/s, precision / "focus" mode
  hitboxRadius: 3.5, // true hitbox — much smaller than the sprite
  grazeRadius: 16, // graze ring for bonus score & tension feedback

  spawnInvulnMs: 2400, // i-frames on (re)spawn
  bombInvulnMs: 1600, // i-frames while a bomb is active
  deathPowerPenalty: 1, // power levels dropped on death (respawn-in-place)

  fireIntervalMs: 95, // base auto-fire cadence at power level 1
  minPowerLevel: 1,
  maxPowerLevel: 5,

  bombDamage: 60,
  bombClearsBullets: true,
} as const;

export const SCORING = {
  enemyKill: 100,
  grazePerTick: 50,
  powerUpPickup: 200,
  bombPickup: 300,
  bossPhaseClear: 5000,
  // Combo: every kill bumps the multiplier; it decays if you stop killing.
  comboDecayMs: 2200,
  comboMax: 64,
  // 1CC bonus awarded for clearing a level without using a continue.
  noContinueLevelBonus: 50000,
} as const;

export const BULLET = {
  playerSpeed: 620,
  playerDamage: 1,
  // Pool sizes — generous so we never allocate mid-frame.
  playerPoolSize: 256,
  enemyPoolSize: 1200,
} as const;

/**
 * Per-level difficulty scalars applied on top of the wave data (index 0..2 →
 * levels 1..3). These are the master "feel" dials:
 *  - bulletSpeedMul : enemy bullet speed.
 *  - fireRateMul    : how OFTEN enemies/bosses fire. <1 = sparser (less dense).
 *  - enemyHpMul     : popcorn enemy HP (bosses are tuned separately).
 * Tuned down from a stricter baseline so stage 1 is approachable while the
 * level-to-level ramp is preserved.
 */
export const DIFFICULTY = {
  bulletSpeedMul: [0.95, 1.06, 1.2],
  fireRateMul: [0.85, 1.0, 1.15],
  enemyHpMul: [0.8, 1.0, 1.2],
} as const;

/** Texture keys produced by the procedural art system. Centralised to avoid typos. */
export const TEX = {
  player: 'tex-player', // 青鸾
  shipBifang: 'tex-ship-bifang', // 毕方
  shipQiongqi: 'tex-ship-qiongqi', // 穷奇
  playerShot: 'tex-player-shot',
  enemyGrunt: 'tex-enemy-grunt',
  enemyWeaver: 'tex-enemy-weaver',
  enemyTurret: 'tex-enemy-turret',
  enemyDiver: 'tex-enemy-diver',
  enemyShot: 'tex-enemy-shot',
  enemyShotAimed: 'tex-enemy-shot-aimed',
  enemyShotBig: 'tex-enemy-shot-big',
  boss1: 'tex-boss-1',
  boss2: 'tex-boss-2',
  boss3: 'tex-boss-3',
  powerUp: 'tex-powerup',
  bombPickup: 'tex-bomb-pickup',
  particle: 'tex-particle',
  starSmall: 'tex-star-small',
  starBig: 'tex-star-big',
  starTileFar: 'tex-star-tile-far',
  starTileNear: 'tex-star-tile-near',

  // Parallax background features (far = planet/ship, mid = asteroids/nebula/debris).
  planetBlue: 'tex-planet-blue',
  planetViolet: 'tex-planet-violet',
  starship: 'tex-starship',
  nebula: 'tex-nebula',
  asteroid1: 'tex-asteroid-1',
  asteroid2: 'tex-asteroid-2',
  asteroid3: 'tex-asteroid-3',
  debris1: 'tex-debris-1',
  debris2: 'tex-debris-2',
  debris3: 'tex-debris-3',

  // Calligraphy theme text (loaded images that replace the system-font menu text).
  txtTitle: 'tex-txt-title',
  txtSelect: 'tex-txt-select',
  txtShipQingluan: 'tex-txt-ship-qingluan',
  txtShipBifang: 'tex-txt-ship-bifang',
  txtShipQiongqi: 'tex-txt-ship-qiongqi',
  txtSortie: 'tex-txt-sortie',
  txtBack: 'tex-txt-back',
} as const;

/** Scene keys. */
export const SCENES = {
  Boot: 'Boot',
  Menu: 'Menu',
  Game: 'Game',
  HUD: 'HUD',
  Pause: 'Pause',
  GameOver: 'GameOver',
  Victory: 'Victory',
} as const;
