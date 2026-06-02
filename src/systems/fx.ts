/**
 * Visual "juice": explosions, hit sparks, screen shake, flashes and floating
 * score popups. Built on a few reusable particle emitters so combat never
 * allocates emitters mid-frame.
 */
import Phaser from 'phaser';
import { COLORS, TEX } from '../config';
import { audio } from './audio';

export class FX {
  private scene: Phaser.Scene;
  private boom: Phaser.GameObjects.Particles.ParticleEmitter;
  private spark: Phaser.GameObjects.Particles.ParticleEmitter;
  private debris: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.boom = scene.add
      .particles(0, 0, TEX.particle, {
        emitting: false,
        speed: { min: 40, max: 240 },
        lifespan: { min: 240, max: 640 },
        scale: { start: 1.0, end: 0 },
        alpha: { start: 1, end: 0 },
        tint: [COLORS.explosion, COLORS.playerFlame, 0xffffff, COLORS.enemyShot],
        blendMode: 'ADD',
      })
      .setDepth(46);

    this.spark = scene.add
      .particles(0, 0, TEX.particle, {
        emitting: false,
        speed: { min: 30, max: 130 },
        lifespan: { min: 120, max: 280 },
        scale: { start: 0.4, end: 0 },
        alpha: { start: 0.9, end: 0 },
        tint: [0xffffff, COLORS.playerShot],
        blendMode: 'ADD',
      })
      .setDepth(46);

    this.debris = scene.add
      .particles(0, 0, TEX.particle, {
        emitting: false,
        speed: { min: 20, max: 90 },
        lifespan: { min: 400, max: 900 },
        scale: { start: 0.35, end: 0 },
        alpha: { start: 0.8, end: 0 },
        gravityY: 60,
        tint: [COLORS.bossDark, COLORS.enemyADark, 0x888888],
      })
      .setDepth(28);
  }

  /** Standard enemy death explosion. */
  explode(x: number, y: number, big = false): void {
    this.boom.explode(big ? 30 : 14, x, y);
    this.debris.explode(big ? 14 : 6, x, y);
    this.flashRing(x, y, big ? 46 : 22, big ? COLORS.explosion : COLORS.enemyShot);
    audio.explosion(big);
    if (big) this.shake(0.012, 320);
  }

  /** Tiny spark when a player bullet connects (no kill). */
  hitSpark(x: number, y: number): void {
    this.spark.explode(3, x, y);
  }

  /** Big player-death blast. */
  playerExplode(x: number, y: number): void {
    this.boom.explode(40, x, y);
    this.flashRing(x, y, 60, COLORS.playerShot);
    this.shake(0.02, 500);
    audio.playerDeath();
  }

  /** Expanding ring flash. */
  flashRing(x: number, y: number, radius: number, color: number): void {
    const ring = this.scene.add.circle(x, y, 6, color, 0).setStrokeStyle(3, color, 0.9).setDepth(45);
    this.scene.tweens.add({
      targets: ring,
      radius,
      alpha: 0,
      duration: 260,
      ease: 'Cubic.out',
      onComplete: () => ring.destroy(),
    });
  }

  /** Full-screen white flash (bombs / boss death). */
  screenFlash(alpha = 0.5, durationMs = 220, color = 0xffffff): void {
    const cam = this.scene.cameras.main;
    cam.flash(durationMs, (color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff, true);
    cam.flashEffect.alpha = alpha;
  }

  shake(intensity: number, durationMs: number): void {
    this.scene.cameras.main.shake(durationMs, intensity);
  }

  /** Floating score / combo popup. */
  popText(x: number, y: number, text: string, color = 0xffffff, size = 13): void {
    const t = this.scene.add
      .text(x, y, text, {
        fontFamily: 'ui-monospace, Menlo, monospace',
        fontSize: `${size}px`,
        color: '#' + color.toString(16).padStart(6, '0'),
      })
      .setOrigin(0.5)
      .setDepth(60)
      .setResolution(2);
    this.scene.tweens.add({
      targets: t,
      y: y - 26,
      alpha: 0,
      duration: 700,
      ease: 'Cubic.out',
      onComplete: () => t.destroy(),
    });
  }
}
