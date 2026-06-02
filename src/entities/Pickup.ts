/**
 * Drop pickups: power-ups (raise weapon level) and bomb refills. They fall
 * slowly and are magnetised toward the player when close, so collecting feels
 * generous rather than fiddly.
 */
import Phaser from 'phaser';
import { GAME_HEIGHT, TEX } from '../config';

export type PickupKind = 'power' | 'bomb';

const FALL_SPEED = 70;
const MAGNET_RANGE = 90;
const MAGNET_SPEED = 360;

export class Pickup extends Phaser.GameObjects.Image {
  kind: PickupKind = 'power';
  radius = 14;
  private ageMs = 0;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, TEX.powerUp);
    scene.add.existing(this);
    this.setActive(false).setVisible(false);
    this.setDepth(25);
  }

  activate(x: number, y: number, kind: PickupKind): void {
    this.kind = kind;
    this.setTexture(kind === 'power' ? TEX.powerUp : TEX.bombPickup);
    this.setPosition(x, y);
    this.ageMs = 0;
    this.setActive(true).setVisible(true);
    this.setScale(0);
    this.scene.tweens.add({ targets: this, scale: 1, duration: 180, ease: 'Back.out' });
  }

  deactivate(): void {
    this.setActive(false).setVisible(false);
  }

  update(dtMs: number, px: number, py: number): void {
    const dt = dtMs / 1000;
    this.ageMs += dtMs;
    const dist = Phaser.Math.Distance.Between(this.x, this.y, px, py);
    if (dist < MAGNET_RANGE) {
      const a = Math.atan2(py - this.y, px - this.x);
      this.x += Math.cos(a) * MAGNET_SPEED * dt;
      this.y += Math.sin(a) * MAGNET_SPEED * dt;
    } else {
      this.y += FALL_SPEED * dt;
      this.x += Math.sin(this.ageMs / 280) * 14 * dt;
    }
    // gentle spin shimmer
    this.setScale(1 + Math.sin(this.ageMs / 160) * 0.08);
  }

  isOffscreen(): boolean {
    return this.y > GAME_HEIGHT + 30;
  }
}

export class PickupPool {
  readonly group: Phaser.GameObjects.Group;

  constructor(scene: Phaser.Scene, size = 32) {
    this.group = scene.add.group({ classType: Pickup, maxSize: size });
  }

  spawn(x: number, y: number, kind: PickupKind): Pickup | null {
    const p = this.group.get(x, y) as Pickup | null;
    if (!p) return null;
    p.activate(x, y, kind);
    return p;
  }

  forEachActive(cb: (p: Pickup) => void): void {
    const children = this.group.getChildren();
    for (let i = 0; i < children.length; i++) {
      const p = children[i] as Pickup;
      if (p.active) cb(p);
    }
  }
}
