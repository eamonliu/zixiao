/**
 * Multi-phase boss. A small state machine: ENTER → (FIGHT ↔ TRANSITION)* → DEAD.
 * Each phase has its own HP pool and fire pattern; clearing a phase clears the
 * screen, flashes, and briefly makes the boss invulnerable before the next
 * pattern escalates. Defeating the final phase ends the level.
 */
import Phaser from 'phaser';
import { GAME_WIDTH, SPRITE_SCALE } from '../config';
import { BattleContext, Combatant, FireFn } from './Enemy';

export interface BossPhase {
  hp: number;
  fireIntervalMs: number;
  fire: FireFn;
  /** Horizontal sway speed (rad/sec). */
  swaySpeed?: number;
  /** Horizontal sway half-range (px). */
  swayRange?: number;
}

export interface BossDef {
  texture: string;
  name: string;
  radius: number;
  score: number;
  phases: BossPhase[];
}

type BossState = 'enter' | 'fight' | 'transition' | 'dead';

const HOLD_Y = 128;
const ENTER_SPEED = 90; // px/s
const TRANSITION_MS = 1300;

export class Boss extends Phaser.GameObjects.Image implements Combatant {
  params: Record<string, number> = {};
  radius: number;
  readonly def: BossDef;

  private bossState: BossState = 'enter';
  private phaseIndex = 0;
  private phaseHp = 1;
  private phaseMaxHp = 1;
  private homeX: number;
  private ageMs = 0;
  private fireTimer = 0;
  private transitionUntil = 0;
  private flashUntil = 0;

  /** Set by the scene; fired when a phase is cleared (for screen-clear FX). */
  onPhaseClear?: (clearedPhase: number) => void;

  constructor(scene: Phaser.Scene, def: BossDef) {
    super(scene, GAME_WIDTH / 2, -120, def.texture);
    this.def = def;
    this.radius = def.radius * SPRITE_SCALE;
    this.homeX = GAME_WIDTH / 2;
    scene.add.existing(this);
    this.setScale(SPRITE_SCALE);
    this.setDepth(32);
    this.beginPhase(0);
    this.bossState = 'enter';
  }

  private beginPhase(i: number): void {
    this.phaseIndex = i;
    this.phaseHp = this.phaseMaxHp = this.def.phases[i].hp;
    this.fireTimer = this.def.phases[i].fireIntervalMs;
    this.params = {};
  }

  get displayName(): string {
    return this.def.name;
  }
  get phaseCount(): number {
    return this.def.phases.length;
  }
  get currentPhase(): number {
    return this.phaseIndex;
  }
  /** 0..1 health of the current phase (for the HUD bar). */
  get phaseRatio(): number {
    return Phaser.Math.Clamp(this.phaseHp / this.phaseMaxHp, 0, 1);
  }
  get isAlive(): boolean {
    return this.bossState !== 'dead';
  }
  /** Vulnerable only while actively fighting. */
  get vulnerable(): boolean {
    return this.bossState === 'fight';
  }

  /** @returns true if this damage destroyed the boss (final phase). */
  hit(dmg: number): boolean {
    if (this.bossState !== 'fight') return false;
    this.phaseHp -= dmg;
    this.flashUntil = this.scene.time.now + 40;
    this.setTintFill(0xffffff);
    if (this.phaseHp <= 0) return this.advancePhase();
    return false;
  }

  /** Advance to the next phase, or die. @returns true if dead. */
  private advancePhase(): boolean {
    this.onPhaseClear?.(this.phaseIndex);
    if (this.phaseIndex + 1 >= this.def.phases.length) {
      this.bossState = 'dead';
      return true;
    }
    this.bossState = 'transition';
    this.transitionUntil = this.scene.time.now + TRANSITION_MS;
    this.params.nextPhase = this.phaseIndex + 1;
    return false;
  }

  update(dtMs: number, ctx: BattleContext): void {
    this.ageMs += dtMs;
    const dt = dtMs / 1000;
    const now = this.scene.time.now;

    if (now >= this.flashUntil && this.isTinted) this.clearTint();

    switch (this.bossState) {
      case 'enter': {
        this.y += ENTER_SPEED * dt;
        if (this.y >= HOLD_Y) {
          this.y = HOLD_Y;
          this.bossState = 'fight';
        }
        break;
      }
      case 'fight': {
        this.sway();
        this.fireTimer -= dtMs;
        if (this.fireTimer <= 0) {
          const phase = this.def.phases[this.phaseIndex];
          phase.fire(this, ctx);
          this.fireTimer += phase.fireIntervalMs / Math.max(0.4, ctx.fireRateMul);
        }
        break;
      }
      case 'transition': {
        const blink = Math.floor(now / 70) % 2 === 0;
        this.setAlpha(blink ? 1 : 0.4);
        if (now >= this.transitionUntil) {
          this.setAlpha(1);
          this.beginPhase(this.params.nextPhase ?? this.phaseIndex + 1);
          this.bossState = 'fight';
        }
        break;
      }
      case 'dead':
        break;
    }
  }

  private sway(): void {
    const phase = this.def.phases[this.phaseIndex];
    const speed = phase.swaySpeed ?? 0.9;
    const range = phase.swayRange ?? GAME_WIDTH / 2 - this.width / 2 - 16;
    this.x = this.homeX + Math.sin((this.ageMs / 1000) * speed) * range;
  }
}
