/**
 * Bullets — both the player's shots and enemy fire run through this one pooled
 * type. Movement is integrated manually (px/sec) for frame-rate independence
 * and precise circular-hitbox collision.
 */
import Phaser from 'phaser';
import { TEX } from '../config';

export interface BulletOpts {
  vx: number;
  vy: number;
  texture?: string;
  radius?: number;
  damage?: number;
  /** Rotate the sprite to face its velocity (for needle/dart bullets). */
  orient?: boolean;
  /** Constant spin (rad/sec) for decorative tumbling. */
  spin?: number;
  scale?: number;
  tint?: number;
}

export class Bullet extends Phaser.GameObjects.Image {
  vx = 0;
  vy = 0;
  radius = 4;
  damage = 1;
  /** Set once an enemy bullet has been grazed, so it only scores once. */
  grazed = false;
  private orient = false;
  private spin = 0;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, TEX.enemyShot);
    scene.add.existing(this);
    this.setActive(false).setVisible(false);
  }

  activate(x: number, y: number, o: BulletOpts): void {
    this.setTexture(o.texture ?? TEX.enemyShot);
    this.setPosition(x, y);
    this.vx = o.vx;
    this.vy = o.vy;
    this.radius = o.radius ?? 4;
    this.damage = o.damage ?? 1;
    this.grazed = false;
    this.orient = o.orient ?? false;
    this.spin = o.spin ?? 0;
    this.setScale(o.scale ?? 1); // bullet textures are pre-baked at display size
    this.setRotation(this.orient ? Math.atan2(o.vy, o.vx) + Math.PI / 2 : 0);
    if (o.tint !== undefined) this.setTint(o.tint);
    else this.clearTint();
    this.setActive(true).setVisible(true);
  }

  deactivate(): void {
    this.setActive(false).setVisible(false);
  }

  /** Advance by dtMs milliseconds (velocities are in px/sec). */
  step(dtMs: number): void {
    const dt = dtMs / 1000;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.spin !== 0) this.rotation += this.spin * dt;
  }

  /** Re-target an in-flight bullet (used by homing / curving patterns). */
  setVelocity(vx: number, vy: number): void {
    this.vx = vx;
    this.vy = vy;
    if (this.orient) this.setRotation(Math.atan2(vy, vx) + Math.PI / 2);
  }
}

/** A fixed-capacity pool of bullets backed by a Phaser Group. */
export class BulletPool {
  readonly group: Phaser.GameObjects.Group;
  private readonly depth: number;

  constructor(scene: Phaser.Scene, size: number, depth: number) {
    this.depth = depth;
    this.group = scene.add.group({ classType: Bullet, maxSize: size });
  }

  spawn(x: number, y: number, o: BulletOpts): Bullet | null {
    const b = this.group.get(x, y) as Bullet | null;
    if (!b) return null; // pool exhausted — silently drop (cap keeps perf bounded)
    b.activate(x, y, o);
    b.setDepth(this.depth);
    return b;
  }

  countActive(): number {
    return this.group.countActive(true);
  }

  /** Run a callback for each live bullet; return true from cb to recycle it. */
  forEachActive(cb: (b: Bullet) => boolean | void): void {
    const children = this.group.getChildren();
    for (let i = 0; i < children.length; i++) {
      const b = children[i] as Bullet;
      if (!b.active) continue;
      if (cb(b) === true) b.deactivate();
    }
  }

  /** Recycle every active bullet (e.g. when a bomb clears the screen). */
  clearAll(onEach?: (b: Bullet) => void): void {
    this.forEachActive((b) => {
      if (onEach) onEach(b);
      return true;
    });
  }
}
