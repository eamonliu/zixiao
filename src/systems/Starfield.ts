/**
 * Multi-layer parallax background.
 *
 * Back-to-front:
 *   1. colour wash (deep space tint)
 *   2. far feature — a huge slow-drifting planet or capital ship
 *   3. far star tile
 *   4. mid feature — drifting asteroids / nebula / debris (per theme)
 *   5. near star tile
 *
 * Each level picks a theme so the three stages look distinct. The class name is
 * kept as `Starfield` for drop-in compatibility, but it now owns the whole
 * backdrop. Everything is frame-rate independent and sits below the gameplay
 * depth range.
 */
import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, TEX } from '../config';

interface FarCfg {
  tex: string;
  xFrac: number; // horizontal centre as a fraction of width
  yStart: number;
  scale: number;
  alpha: number;
  speed: number; // px/sec downward drift
}

interface MidCfg {
  texes: string[];
  count: number;
  speed: number; // base px/sec
  scaleMin: number;
  scaleMax: number;
  alpha: number;
  additive: boolean;
  spin: number; // base rad/sec
}

interface Theme {
  wash: number;
  washAlpha: number;
  tint: number;
  far: FarCfg;
  mid: MidCfg;
}

const THEMES: Theme[] = [
  {
    wash: 0x0a1330,
    washAlpha: 0.25,
    tint: 0xffffff,
    far: { tex: TEX.planetBlue, xFrac: 0.66, yStart: 70, scale: 1.0, alpha: 0.9, speed: 7 },
    mid: { texes: [TEX.asteroid1, TEX.asteroid2, TEX.asteroid3], count: 7, speed: 46, scaleMin: 0.5, scaleMax: 1.0, alpha: 0.85, additive: false, spin: 0.5 },
  },
  {
    wash: 0x101a3a,
    washAlpha: 0.3,
    tint: 0xc8d6ff,
    far: { tex: TEX.starship, xFrac: 0.5, yStart: 40, scale: 0.92, alpha: 0.9, speed: 11 },
    mid: { texes: [TEX.nebula], count: 4, speed: 22, scaleMin: 1.3, scaleMax: 2.3, alpha: 0.5, additive: true, spin: 0.04 },
  },
  {
    wash: 0x1c1030,
    washAlpha: 0.3,
    tint: 0xffd0e6,
    far: { tex: TEX.planetViolet, xFrac: 0.38, yStart: 110, scale: 0.82, alpha: 0.92, speed: 6 },
    mid: { texes: [TEX.debris1, TEX.debris2, TEX.debris3], count: 8, speed: 42, scaleMin: 0.5, scaleMax: 1.05, alpha: 0.85, additive: false, spin: 0.8 },
  },
];

interface MidObj {
  img: Phaser.GameObjects.Image;
  speed: number;
  spin: number;
}

export class Starfield {
  private scene: Phaser.Scene;
  private baseDepth: number;
  private farSpeed: number;
  private nearSpeed: number;
  private speedScale = 1;
  private ageMs = 0;

  private wash: Phaser.GameObjects.Rectangle;
  private farStars: Phaser.GameObjects.TileSprite;
  private nearStars: Phaser.GameObjects.TileSprite;

  private farImg?: Phaser.GameObjects.Image;
  private farCfg?: FarCfg;
  private mid: MidObj[] = [];
  private midCfg?: MidCfg;

  constructor(scene: Phaser.Scene, depth = 0, farSpeed = 28, nearSpeed = 84) {
    this.scene = scene;
    this.baseDepth = depth;
    this.farSpeed = farSpeed;
    this.nearSpeed = nearSpeed;

    this.wash = scene.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, THEMES[0].wash, THEMES[0].washAlpha)
      .setOrigin(0)
      .setDepth(depth - 40);

    this.farStars = scene.add
      .tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, TEX.starTileFar)
      .setOrigin(0)
      .setDepth(depth - 30);

    this.nearStars = scene.add
      .tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, TEX.starTileNear)
      .setOrigin(0)
      .setDepth(depth - 10);
  }

  setTheme(level: number): void {
    const t = THEMES[Phaser.Math.Clamp(level, 0, THEMES.length - 1)];
    this.wash.setFillStyle(t.wash, t.washAlpha);
    this.farStars.setTint(t.tint);
    this.nearStars.setTint(t.tint);

    // Far feature.
    this.farImg?.destroy();
    this.farCfg = t.far;
    this.farImg = this.scene.add
      .image(GAME_WIDTH * t.far.xFrac, t.far.yStart, t.far.tex)
      .setDepth(this.baseDepth - 35)
      .setScale(t.far.scale)
      .setAlpha(t.far.alpha);

    // Mid feature objects.
    for (const m of this.mid) m.img.destroy();
    this.mid = [];
    this.midCfg = t.mid;
    for (let i = 0; i < t.mid.count; i++) {
      const img = this.scene.add
        .image(
          Math.random() * GAME_WIDTH,
          (i / t.mid.count) * GAME_HEIGHT - Math.random() * 80,
          Phaser.Utils.Array.GetRandom(t.mid.texes),
        )
        .setDepth(this.baseDepth - 20)
        .setScale(Phaser.Math.FloatBetween(t.mid.scaleMin, t.mid.scaleMax))
        .setAlpha(t.mid.alpha)
        .setRotation(Math.random() * Math.PI * 2);
      if (t.mid.additive) img.setBlendMode(Phaser.BlendModes.ADD);
      this.mid.push({
        img,
        speed: t.mid.speed * Phaser.Math.FloatBetween(0.7, 1.3),
        spin: t.mid.spin * Phaser.Math.FloatBetween(-1, 1),
      });
    }
  }

  /** Speed multiplier — bump during boss intros / hyperspace moments. */
  setSpeedScale(scale: number): void {
    this.speedScale = scale;
  }

  update(dtMs: number): void {
    const dt = dtMs / 1000;
    this.ageMs += dtMs;
    const ss = this.speedScale;

    this.farStars.tilePositionY -= this.farSpeed * ss * dt;
    this.nearStars.tilePositionY -= this.nearSpeed * ss * dt;

    if (this.farImg && this.farCfg) {
      this.farImg.y += this.farCfg.speed * ss * dt;
      this.farImg.x = GAME_WIDTH * this.farCfg.xFrac + Math.sin(this.ageMs / 4000) * 12;
      const h = this.farImg.displayHeight;
      if (this.farImg.y - h / 2 > GAME_HEIGHT) this.farImg.y = -h / 2;
    }

    for (const m of this.mid) {
      m.img.y += m.speed * ss * dt;
      m.img.rotation += m.spin * dt;
      const h = m.img.displayHeight;
      if (m.img.y - h / 2 > GAME_HEIGHT) {
        m.img.y = -h / 2 - Math.random() * 60;
        m.img.x = Math.random() * GAME_WIDTH;
        if (this.midCfg) m.img.setScale(Phaser.Math.FloatBetween(this.midCfg.scaleMin, this.midCfg.scaleMax));
      }
    }
  }

  destroy(): void {
    this.wash.destroy();
    this.farStars.destroy();
    this.nearStars.destroy();
    this.farImg?.destroy();
    for (const m of this.mid) m.img.destroy();
    this.mid = [];
  }
}
