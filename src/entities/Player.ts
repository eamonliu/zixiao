/**
 * The player's ship.
 *
 * A Container holding the ship sprite and a tiny "true hitbox" indicator. The
 * hitbox is deliberately much smaller than the sprite (bullet-hell convention)
 * so near-misses feel fair and graze-able. Movement supports both keyboard
 * (velocity) and touch (1:1 relative drag).
 */
import Phaser from 'phaser';
import { BULLET, COLORS, GAME_HEIGHT, GAME_WIDTH, PLAY_BOUNDS, PLAYER, SPRITE_SCALE, TEX } from '../config';
import { InputManager } from '../systems/input';
import { BulletPool } from './Bullet';
import { audio } from '../systems/audio';
import { run } from '../state';
import { getShip, ShipDef } from '../ships';

interface ShotDef {
  dx: number; // muzzle x offset
  angle: number; // degrees from straight up (+ = clockwise / rightward)
}

// Weapon table indexed by power level 1..5. More power = more streams + spread.
const WEAPON: Record<number, ShotDef[]> = {
  1: [{ dx: 0, angle: 0 }],
  2: [
    { dx: -6, angle: 0 },
    { dx: 6, angle: 0 },
  ],
  3: [
    { dx: 0, angle: 0 },
    { dx: -8, angle: 0 },
    { dx: 8, angle: 0 },
  ],
  4: [
    { dx: -5, angle: 0 },
    { dx: 5, angle: 0 },
    { dx: -11, angle: -10 },
    { dx: 11, angle: 10 },
  ],
  5: [
    { dx: 0, angle: 0 },
    { dx: -6, angle: 0 },
    { dx: 6, angle: 0 },
    { dx: -12, angle: -16 },
    { dx: 12, angle: 16 },
  ],
};

export const PLAYER_START_X = GAME_WIDTH / 2;
export const PLAYER_START_Y = GAME_HEIGHT - 120;

export class Player extends Phaser.GameObjects.Container {
  private inputMgr: InputManager;
  private bullets: BulletPool;
  private shipImg: Phaser.GameObjects.Image;
  private hitDot: Phaser.GameObjects.Arc;
  private engine: Phaser.GameObjects.Particles.ParticleEmitter;

  private readonly ship: ShipDef = getShip(run.shipId);

  readonly hitRadius = PLAYER.hitboxRadius;
  readonly grazeRadius = PLAYER.grazeRadius;
  alive = true;
  powerLevel = run.powerLevel;

  private invulnUntil = 0;
  private fireTimer = 0;
  private dragOffsetX = 0;
  private dragOffsetY = 0;

  constructor(scene: Phaser.Scene, input: InputManager, bullets: BulletPool) {
    super(scene, PLAYER_START_X, PLAYER_START_Y);
    this.inputMgr = input;
    this.bullets = bullets;

    this.shipImg = scene.add.image(0, 0, this.ship.texture).setScale(SPRITE_SCALE);
    this.hitDot = scene.add.circle(0, 0, 2.6, COLORS.hudPink).setVisible(false);
    const core = scene.add.circle(0, 0, 1.2, 0xffffff).setVisible(false);
    this.add([this.shipImg, this.hitDot, core]);
    this.hitDot.setData('core', core);

    scene.add.existing(this);
    this.setDepth(40);

    // Engine trail — lives in world space, follows the ship.
    this.engine = scene.add.particles(0, 0, TEX.particle, {
      speedY: { min: 90, max: 170 },
      speedX: { min: -18, max: 18 },
      lifespan: { min: 160, max: 320 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.7, end: 0 },
      tint: this.ship.engineTint,
      blendMode: 'ADD',
      frequency: 16,
      quantity: 1,
    });
    this.engine.setDepth(39);
    this.engine.startFollow(this, 0, 14 * SPRITE_SCALE);

    this.setInvuln(PLAYER.spawnInvulnMs);
  }

  // ---- State ---------------------------------------------------------------

  setInvuln(ms: number): void {
    this.invulnUntil = this.scene.time.now + ms;
  }

  isInvulnerable(): boolean {
    return this.scene.time.now < this.invulnUntil;
  }

  setPower(level: number): void {
    this.powerLevel = Phaser.Math.Clamp(level, PLAYER.minPowerLevel, PLAYER.maxPowerLevel);
    run.powerLevel = this.powerLevel;
  }

  addPower(n = 1): boolean {
    const before = this.powerLevel;
    this.setPower(this.powerLevel + n);
    return this.powerLevel !== before;
  }

  /** Returns the world-space centre of the true hitbox. */
  get hitX(): number {
    return this.x;
  }
  get hitY(): number {
    return this.y;
  }

  // ---- Lifecycle -----------------------------------------------------------

  kill(): void {
    this.alive = false;
    this.setVisible(false);
    this.engine.stop();
  }

  respawn(): void {
    this.alive = true;
    this.setPosition(PLAYER_START_X, PLAYER_START_Y);
    this.setVisible(true);
    this.setAlpha(1);
    this.engine.start();
    this.setPower(this.powerLevel - PLAYER.deathPowerPenalty);
    this.setInvuln(PLAYER.spawnInvulnMs);
    this.fireTimer = 0;
  }

  // ---- Per-frame -----------------------------------------------------------

  update(dtMs: number): void {
    if (!this.alive) return;
    const dt = dtMs / 1000;
    this.move(dt);
    this.updateFire(dtMs);
    this.updateVisuals();
  }

  private move(dt: number): void {
    const focusing = this.inputMgr.focus();
    const speed = focusing ? this.ship.focusSpeed : this.ship.speed;

    if (this.inputMgr.hasKeyboardMove()) {
      const v = this.inputMgr.kbVec();
      const len = Math.hypot(v.x, v.y) || 1;
      this.x += (v.x / len) * speed * dt;
      this.y += (v.y / len) * speed * dt;
    } else if (this.inputMgr.pActive) {
      // Touch: relative 1:1 drag, anchored on press so the ship never jumps.
      if (this.inputMgr.consumePointerJustDown()) {
        this.dragOffsetX = this.x - this.inputMgr.px;
        this.dragOffsetY = this.y - this.inputMgr.py;
      }
      this.x = this.inputMgr.px + this.dragOffsetX;
      this.y = this.inputMgr.py + this.dragOffsetY;
    }

    this.x = Phaser.Math.Clamp(this.x, PLAY_BOUNDS.left, PLAY_BOUNDS.right);
    this.y = Phaser.Math.Clamp(this.y, PLAY_BOUNDS.top, PLAY_BOUNDS.bottom);
  }

  private updateFire(dtMs: number): void {
    this.fireTimer -= dtMs;
    if (this.fireTimer > 0) return;
    this.fireTimer += this.ship.fireIntervalMs;

    const shots = WEAPON[this.powerLevel] ?? WEAPON[1];
    const speed = BULLET.playerSpeed;
    const tint = this.ship.shotTint;
    for (const s of shots) {
      const rad = Phaser.Math.DegToRad(s.angle);
      this.bullets.spawn(this.x + s.dx, this.y - 16 * SPRITE_SCALE, {
        vx: Math.sin(rad) * speed,
        vy: -Math.cos(rad) * speed,
        texture: TEX.playerShot,
        radius: 5 * SPRITE_SCALE,
        damage: BULLET.playerDamage * this.ship.damageMul,
        orient: s.angle !== 0,
        tint: tint === 0xffffff ? undefined : tint,
      });
    }
    audio.playerShot();
  }

  private updateVisuals(): void {
    const focusing = this.inputMgr.focus();
    this.hitDot.setVisible(focusing);
    const core = this.hitDot.getData('core') as Phaser.GameObjects.Arc;
    core.setVisible(focusing);

    // Blink while invulnerable.
    if (this.isInvulnerable()) {
      const blink = Math.floor(this.scene.time.now / 60) % 2 === 0;
      this.shipImg.setAlpha(blink ? 1 : 0.35);
    } else {
      this.shipImg.setAlpha(1);
    }

    // Subtle bank when moving horizontally.
    const targetAngle = this.inputMgr.hasKeyboardMove()
      ? this.inputMgr.kbVec().x * 8
      : 0;
    this.shipImg.angle = Phaser.Math.Linear(this.shipImg.angle, targetAngle, 0.2);
  }

  destroy(fromScene?: boolean): void {
    this.engine.destroy();
    super.destroy(fromScene);
  }
}
