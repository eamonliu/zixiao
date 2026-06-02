/**
 * Enemy ships. Behaviour is composed from two pluggable functions — a movement
 * function (sets velocity each frame) and an optional fire function (spawns
 * bullets on a timer). This keeps the entity generic; the actual patterns live
 * in systems/patterns.ts and the level data picks from them.
 */
import Phaser from 'phaser';
import { BulletPool } from './Bullet';

export type DropKind = 'none' | 'power' | 'bomb';

/** Everything a fire pattern needs to know about the battlefield. */
export interface BattleContext {
  enemyBullets: BulletPool;
  playerX: number;
  playerY: number;
  level: number; // 0..2, for difficulty scaling
  bulletSpeedMul: number;
  fireRateMul: number;
}

/** The minimum a fire pattern needs from its owner — shared by Enemy and Boss. */
export interface Combatant {
  x: number;
  y: number;
  params: Record<string, number>;
}

export type MovementFn = (e: Enemy, ageMs: number, dtMs: number) => void;
export type FireFn = (c: Combatant, ctx: BattleContext) => void;

export interface EnemyConfig {
  texture: string;
  hp: number;
  radius: number;
  score: number;
  movement: MovementFn;
  fire?: FireFn;
  fireIntervalMs?: number;
  fireDelayMs?: number; // wait before the first shot
  drop?: DropKind;
  /** Scratch values some movement patterns use (amplitude, target x, etc.). */
  params?: Record<string, number>;
}

export class Enemy extends Phaser.GameObjects.Image {
  vx = 0;
  vy = 0;
  hp = 1;
  maxHp = 1;
  radius = 12;
  score = 100;
  drop: DropKind = 'none';
  params: Record<string, number> = {};

  private ageMs = 0;
  private movement: MovementFn | null = null;
  private fire: FireFn | null = null;
  private fireIntervalMs = 0;
  private nextFireAt = Infinity;
  private flashUntil = 0;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, '__DEFAULT');
    scene.add.existing(this);
    this.setActive(false).setVisible(false);
    this.setDepth(30);
  }

  activate(x: number, y: number, cfg: EnemyConfig): void {
    this.setTexture(cfg.texture);
    this.setPosition(x, y);
    this.clearTint();
    this.hp = this.maxHp = cfg.hp;
    this.radius = cfg.radius;
    this.score = cfg.score;
    this.drop = cfg.drop ?? 'none';
    this.movement = cfg.movement;
    this.fire = cfg.fire ?? null;
    this.fireIntervalMs = cfg.fireIntervalMs ?? 0;
    this.params = { ...(cfg.params ?? {}) };
    this.ageMs = 0;
    this.vx = 0;
    this.vy = 0;
    this.nextFireAt = this.fire ? (cfg.fireDelayMs ?? 600) : Infinity;
    this.flashUntil = 0;
    this.setActive(true).setVisible(true);
    this.setScale(1);
  }

  deactivate(): void {
    this.setActive(false).setVisible(false);
  }

  /** @returns true if this damage destroyed the enemy. */
  hit(dmg: number): boolean {
    this.hp -= dmg;
    this.flashUntil = this.scene.time.now + 45;
    this.setTintFill(0xffffff);
    if (this.hp <= 0) {
      this.hp = 0;
      return true;
    }
    return false;
  }

  update(dtMs: number, ctx: BattleContext): void {
    this.ageMs += dtMs;
    const dt = dtMs / 1000;

    if (this.movement) this.movement(this, this.ageMs, dtMs);
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.fire && this.ageMs >= this.nextFireAt) {
      this.fire(this, ctx);
      this.nextFireAt += this.fireIntervalMs / Math.max(0.2, ctx.fireRateMul);
    }

    if (this.scene.time.now >= this.flashUntil && this.isTinted) {
      this.clearTint();
    }
  }

  /** Off the bottom or far off the sides — cull without awarding score. */
  isOffscreen(w: number, h: number): boolean {
    return this.y > h + 60 || this.x < -80 || this.x > w + 80;
  }

  get age(): number {
    return this.ageMs;
  }
}

/** Pool of enemies. Capacity is modest — levels never spawn hundreds at once. */
export class EnemyPool {
  readonly group: Phaser.GameObjects.Group;

  constructor(scene: Phaser.Scene, size = 64) {
    this.group = scene.add.group({ classType: Enemy, maxSize: size });
  }

  spawn(x: number, y: number, cfg: EnemyConfig): Enemy | null {
    const e = this.group.get(x, y) as Enemy | null;
    if (!e) return null;
    e.activate(x, y, cfg);
    return e;
  }

  forEachActive(cb: (e: Enemy) => void): void {
    const children = this.group.getChildren();
    for (let i = 0; i < children.length; i++) {
      const e = children[i] as Enemy;
      if (e.active) cb(e);
    }
  }

  countActive(): number {
    return this.group.countActive(true);
  }
}
