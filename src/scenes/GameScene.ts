import Phaser from 'phaser';
import {
  BULLET,
  COLORS,
  DIFFICULTY,
  GAME_HEIGHT,
  GAME_WIDTH,
  PLAYER,
  SCENES,
  SCORING,
} from '../config';
import { Starfield } from '../systems/Starfield';
import { InputManager } from '../systems/input';
import { FX } from '../systems/fx';
import { audio } from '../systems/audio';
import { BulletPool } from '../entities/Bullet';
import { BattleContext, EnemyConfig, Enemy, EnemyPool } from '../entities/Enemy';
import { Pickup, PickupKind, PickupPool } from '../entities/Pickup';
import { Player } from '../entities/Player';
import { Boss } from '../entities/Boss';
import { WaveDirector } from '../systems/WaveDirector';
import { getLevel, LEVEL_COUNT } from '../levels';
import { LevelApi, LevelDef } from '../levels/types';
import { commitHiScore, run } from '../state';

type GameState = 'play' | 'boss' | 'clear' | 'gameover';

export interface BossInfo {
  name: string;
  ratio: number;
  phase: number;
  phaseCount: number;
}

function circleHit(
  ax: number,
  ay: number,
  ar: number,
  bx: number,
  by: number,
  br: number,
): boolean {
  const dx = ax - bx;
  const dy = ay - by;
  const r = ar + br;
  return dx * dx + dy * dy <= r * r;
}

export class GameScene extends Phaser.Scene {
  // Public surface read by the HUD.
  inputMgr!: InputManager;
  combo = 0;
  boss?: Boss;

  private stars!: Starfield;
  private fx!: FX;
  private playerBullets!: BulletPool;
  private enemyBullets!: BulletPool;
  private enemies!: EnemyPool;
  private pickups!: PickupPool;
  private player!: Player;

  private levelDef!: LevelDef;
  private director!: WaveDirector;
  private api!: LevelApi;
  private diffIdx = 0;

  private state: GameState = 'play';
  private respawnAt = 0;
  private comboExpireAt = 0;
  private lastGrazeSfx = 0;

  constructor() {
    super(SCENES.Game);
  }

  create(): void {
    this.state = 'play';
    this.boss = undefined;
    this.respawnAt = 0;
    this.combo = 0;
    this.comboExpireAt = 0;

    this.levelDef = getLevel(run.level);
    this.diffIdx = Phaser.Math.Clamp(this.levelDef.index, 0, 2);

    this.stars = new Starfield(this, 0);
    this.stars.setTheme(this.diffIdx);

    this.fx = new FX(this);
    this.inputMgr = new InputManager(this);

    this.playerBullets = new BulletPool(this, BULLET.playerPoolSize, 35);
    this.enemyBullets = new BulletPool(this, BULLET.enemyPoolSize, 20);
    this.enemies = new EnemyPool(this, 64);
    this.pickups = new PickupPool(this, 32);

    this.player = new Player(this, this.inputMgr, this.playerBullets);

    this.director = new WaveDirector(this.levelDef.cues);
    const hpMul = DIFFICULTY.enemyHpMul[this.diffIdx];
    this.api = {
      scene: this,
      level: this.levelDef.index,
      spawn: (cfg: EnemyConfig, x: number, y: number): Enemy | null => {
        const scaled: EnemyConfig = { ...cfg, hp: Math.max(1, Math.round(cfg.hp * hpMul)) };
        return this.enemies.spawn(x, y, scaled);
      },
    };

    // HUD overlay (don't double-launch across scene.restart()).
    if (!this.scene.isActive(SCENES.HUD)) this.scene.launch(SCENES.HUD);

    this.showBanner(this.levelDef.title, this.levelDef.subtitle);
    audio.startMusic(this.diffIdx);

    this.cameras.main.fadeIn(350, 5, 6, 15);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => audio.stopMusic());
  }

  // ---- Main loop -----------------------------------------------------------

  update(_time: number, delta: number): void {
    const dtMs = Math.min(delta, 50);

    this.stars.update(dtMs);

    if (this.inputMgr.consumePause() && (this.state === 'play' || this.state === 'boss')) {
      this.openPause();
      return;
    }
    if (this.inputMgr.consumeBomb()) this.doBomb();

    if (this.player.alive) this.player.update(dtMs);
    else if (this.respawnAt > 0 && this.time.now >= this.respawnAt) {
      this.respawnAt = 0;
      this.player.respawn();
    }

    const ctx = this.battleContext();

    this.playerBullets.forEachActive((b) => {
      b.step(dtMs);
      return b.y < -24;
    });
    this.enemyBullets.forEachActive((b) => {
      b.step(dtMs);
      return b.x < -28 || b.x > GAME_WIDTH + 28 || b.y < -28 || b.y > GAME_HEIGHT + 28;
    });
    this.enemies.forEachActive((e) => {
      e.update(dtMs, ctx);
      if (e.isOffscreen(GAME_WIDTH, GAME_HEIGHT)) e.deactivate();
    });
    this.pickups.forEachActive((p) => {
      p.update(dtMs, this.player.x, this.player.y);
      if (p.isOffscreen()) p.deactivate();
    });
    if (this.boss) this.boss.update(dtMs, ctx);

    this.collide();

    if (this.state === 'play') {
      this.director.update(dtMs, this.api);
      this.maybeStartBoss();
    }

    if (this.combo > 0 && this.time.now > this.comboExpireAt) this.combo = 0;

    this.inputMgr.lateUpdate(dtMs);
  }

  private battleContext(): BattleContext {
    return {
      enemyBullets: this.enemyBullets,
      playerX: this.player.x,
      playerY: this.player.y,
      level: this.levelDef.index,
      bulletSpeedMul: DIFFICULTY.bulletSpeedMul[this.diffIdx],
      fireRateMul: DIFFICULTY.fireRateMul[this.diffIdx],
    };
  }

  // ---- Collisions ----------------------------------------------------------

  private collide(): void {
    // Player shots → enemies / boss.
    this.playerBullets.forEachActive((b) => {
      let consumed = false;
      this.enemies.forEachActive((e) => {
        if (consumed || !e.active) return;
        if (circleHit(b.x, b.y, b.radius, e.x, e.y, e.radius)) {
          consumed = true;
          this.fx.hitSpark(b.x, b.y);
          if (e.hit(b.damage)) this.onEnemyKilled(e);
        }
      });
      if (!consumed && this.boss && this.boss.vulnerable) {
        if (circleHit(b.x, b.y, b.radius, this.boss.x, this.boss.y, this.boss.radius)) {
          consumed = true;
          this.fx.hitSpark(b.x, b.y);
          if (this.boss.hit(b.damage)) this.onBossDefeated();
        }
      }
      return consumed;
    });

    // Enemy bullets → player (+ graze).
    if (this.player.alive && !this.player.isInvulnerable()) {
      const px = this.player.hitX;
      const py = this.player.hitY;
      this.enemyBullets.forEachActive((b) => {
        const dx = b.x - px;
        const dy = b.y - py;
        const d2 = dx * dx + dy * dy;
        const hitR = b.radius + this.player.hitRadius;
        if (d2 <= hitR * hitR) {
          this.onPlayerHit();
          return true;
        }
        const grazeR = b.radius + this.player.grazeRadius;
        if (!b.grazed && d2 <= grazeR * grazeR) {
          b.grazed = true;
          this.onGraze();
        }
        return false;
      });
    }

    // Body contact → player.
    if (this.player.alive && !this.player.isInvulnerable()) {
      const bodyR = this.player.hitRadius + 6;
      this.enemies.forEachActive((e) => {
        if (!this.player.alive) return;
        if (circleHit(e.x, e.y, e.radius, this.player.hitX, this.player.hitY, bodyR)) {
          if (e.hit(8)) this.onEnemyKilled(e);
          this.onPlayerHit();
        }
      });
      if (
        this.player.alive &&
        this.boss &&
        this.boss.isAlive &&
        circleHit(this.boss.x, this.boss.y, this.boss.radius * 0.7, this.player.hitX, this.player.hitY, bodyR)
      ) {
        this.onPlayerHit();
      }
    }

    // Pickups → player.
    if (this.player.alive) {
      this.pickups.forEachActive((p) => {
        if (circleHit(p.x, p.y, p.radius, this.player.x, this.player.y, 16)) {
          this.collectPickup(p);
          p.deactivate();
        }
      });
    }
  }

  // ---- Combat events -------------------------------------------------------

  private onEnemyKilled(e: Enemy): void {
    run.kills++;
    this.bumpCombo();
    this.addScore(e.score, e.x, e.y);
    this.fx.explode(e.x, e.y, e.maxHp >= 20);
    this.maybeDrop(e);
    e.deactivate();
  }

  private maybeDrop(e: Enemy): void {
    if (e.drop === 'power') this.spawnPickup(e.x, e.y, 'power');
    else if (e.drop === 'bomb') this.spawnPickup(e.x, e.y, 'bomb');
    else if (Math.random() < 0.04) this.spawnPickup(e.x, e.y, 'power');
  }

  private spawnPickup(x: number, y: number, kind: PickupKind): void {
    this.pickups.spawn(x, y, kind);
  }

  private collectPickup(p: Pickup): void {
    if (p.kind === 'power') {
      if (this.player.addPower(1)) {
        this.addScore(SCORING.powerUpPickup, p.x, p.y);
        this.fx.popText(p.x, p.y - 10, `POWER ${this.player.powerLevel}`, COLORS.powerUp);
      } else {
        this.addScore(SCORING.powerUpPickup * 2, p.x, p.y); // maxed → bonus
      }
      audio.powerUp();
    } else {
      run.bombs = Math.min(PLAYER.maxBombs, run.bombs + 1);
      this.addScore(SCORING.bombPickup, p.x, p.y);
      this.fx.popText(p.x, p.y - 10, 'BOMB +1', COLORS.bombPickup);
      audio.bombPickup();
    }
  }

  private onGraze(): void {
    run.score += SCORING.grazePerTick;
    if (this.time.now - this.lastGrazeSfx > 70) {
      audio.graze();
      this.lastGrazeSfx = this.time.now;
    }
  }

  private onPlayerHit(): void {
    if (!this.player.alive || this.player.isInvulnerable()) return;
    this.player.kill();
    this.fx.playerExplode(this.player.x, this.player.y);
    this.combo = 0;
    run.lives -= 1;

    // Mercy: clear bullets around the death site so respawn isn't instant death.
    this.clearBulletsNear(this.player.x, this.player.y, 130);

    if (run.lives <= 0) {
      this.gameOver();
    } else {
      this.respawnAt = this.time.now + 1000;
    }
  }

  private clearBulletsNear(x: number, y: number, radius: number): void {
    const r2 = radius * radius;
    this.enemyBullets.forEachActive((b) => {
      const dx = b.x - x;
      const dy = b.y - y;
      return dx * dx + dy * dy <= r2;
    });
  }

  // ---- Bomb ----------------------------------------------------------------

  private doBomb(): void {
    if (!this.player.alive) return;
    if (this.state !== 'play' && this.state !== 'boss') return;
    if (run.bombs <= 0) return;

    run.bombs -= 1;
    audio.bomb();
    this.fx.screenFlash(0.6, 240, COLORS.playerShot);
    this.fx.shake(0.02, 420);
    this.player.setInvuln(PLAYER.bombInvulnMs);

    // Convert all enemy bullets to a little score.
    let cleared = 0;
    this.enemyBullets.clearAll(() => {
      cleared++;
    });
    if (cleared > 0) run.score += cleared * 10;

    this.enemies.forEachActive((e) => {
      if (e.hit(PLAYER.bombDamage)) this.onEnemyKilled(e);
    });
    if (this.boss && this.boss.vulnerable) {
      if (this.boss.hit(PLAYER.bombDamage)) this.onBossDefeated();
    }
  }

  // ---- Boss ----------------------------------------------------------------

  private maybeStartBoss(): void {
    if (this.boss) return;
    const cleared = this.director.finished && this.enemies.countActive() === 0;
    const timedOut = this.director.clockMs > this.director.lastCueAt + 5000;
    if (cleared || timedOut) this.startBoss();
  }

  private startBoss(): void {
    this.state = 'boss';
    audio.warning();
    this.showBanner('WARNING', this.levelDef.boss.name, 0xff5d73);
    this.time.delayedCall(1600, () => {
      if (this.state !== 'boss') return;
      const boss = new Boss(this, this.levelDef.boss);
      boss.onPhaseClear = () => {
        this.fx.screenFlash(0.4, 200, 0xffffff);
        this.fx.shake(0.012, 260);
        this.enemyBullets.clearAll();
      };
      this.boss = boss;
    });
  }

  private onBossDefeated(): void {
    if (this.state === 'clear') return;
    this.state = 'clear';
    const boss = this.boss;
    // Detach immediately: the death animation below drives the boss through a
    // captured local reference, so the main update loop must stop touching it
    // (it gets destroyed mid-sequence, which would otherwise crash boss.update).
    this.boss = undefined;
    audio.stopMusic();

    if (boss) {
      run.score += boss.def.score;
      // Chain of explosions across the hull.
      for (let i = 0; i < 12; i++) {
        this.time.delayedCall(i * 110, () => {
          const ox = boss.x + Phaser.Math.Between(-60, 60);
          const oy = boss.y + Phaser.Math.Between(-40, 40);
          this.fx.explode(ox, oy, i % 3 === 0);
        });
      }
      this.tweens.add({ targets: boss, alpha: 0, duration: 1300, delay: 700 });
      this.time.delayedCall(1400, () => boss.destroy());
    }
    this.enemyBullets.clearAll();
    this.fx.screenFlash(0.8, 600, 0xffffff);
    this.fx.shake(0.03, 800);

    if (!run.usedContinueThisRun) {
      run.score += SCORING.noContinueLevelBonus;
      this.time.delayedCall(900, () =>
        this.fx.popText(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, `CLEAN BONUS +${SCORING.noContinueLevelBonus}`, COLORS.graze, 16),
      );
    }

    this.showBanner('STAGE CLEAR', '', COLORS.hudCyan, 2600);
    this.time.delayedCall(3200, () => this.advanceLevel());
  }

  private advanceLevel(): void {
    commitHiScore();
    if (run.level < LEVEL_COUNT - 1) {
      run.level += 1;
      this.cameras.main.fadeOut(400, 5, 6, 15);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.restart();
      });
    } else {
      this.scene.stop(SCENES.HUD);
      this.scene.start(SCENES.Victory);
    }
  }

  // ---- Score / combo -------------------------------------------------------

  get comboMult(): number {
    return 1 + Math.min(this.combo, SCORING.comboMax) * 0.04;
  }

  private bumpCombo(): void {
    this.combo += 1;
    this.comboExpireAt = this.time.now + SCORING.comboDecayMs;
    if (this.combo > run.bestCombo) run.bestCombo = this.combo;
  }

  private addScore(base: number, x?: number, y?: number): void {
    const gained = Math.round(base * this.comboMult);
    run.score += gained;
    if (run.score > run.hiScore) run.hiScore = run.score;
    if (x !== undefined && y !== undefined && this.combo >= 5) {
      this.fx.popText(x, y - 8, `${gained}`, 0xffffff, 11);
    }
  }

  // ---- Pause / game over ---------------------------------------------------

  private openPause(): void {
    this.scene.pause();
    this.scene.launch(SCENES.Pause);
  }

  private gameOver(): void {
    this.state = 'gameover';
    audio.stopMusic();
    commitHiScore();
    this.player.setInvuln(999999);
    this.scene.pause();
    this.scene.launch(SCENES.GameOver);
  }

  // ---- HUD data ------------------------------------------------------------

  get bossInfo(): BossInfo | null {
    if (!this.boss || !this.boss.isAlive) return null;
    return {
      name: this.boss.displayName,
      ratio: this.boss.phaseRatio,
      phase: this.boss.currentPhase,
      phaseCount: this.boss.phaseCount,
    };
  }

  get levelTitle(): string {
    return this.levelDef ? this.levelDef.title : '';
  }

  get playerPower(): number {
    return this.player ? this.player.powerLevel : 1;
  }

  // ---- Banner --------------------------------------------------------------

  private showBanner(title: string, subtitle: string, color = 0xffffff, holdMs = 2000): void {
    const cx = GAME_WIDTH / 2;
    const t = this.add
      .text(cx, GAME_HEIGHT / 2 - 16, title, {
        fontFamily: 'ui-monospace, Menlo, monospace',
        fontSize: '42px',
        color: '#' + color.toString(16).padStart(6, '0'),
      })
      .setOrigin(0.5)
      .setDepth(70)
      .setResolution(2)
      .setAlpha(0);
    t.setShadow(0, 0, '#000000', 8, true, true);

    const sub = subtitle
      ? this.add
          .text(cx, GAME_HEIGHT / 2 + 22, subtitle, {
            fontFamily: 'ui-monospace, Menlo, monospace',
            fontSize: '16px',
            color: '#cfe0ff',
          })
          .setOrigin(0.5)
          .setDepth(70)
          .setResolution(2)
          .setAlpha(0)
      : null;

    const targets = sub ? [t, sub] : [t];
    this.tweens.add({ targets, alpha: 1, duration: 300, yoyo: true, hold: holdMs, ease: 'Sine.inOut' });
    this.time.delayedCall(holdMs + 700, () => {
      t.destroy();
      sub?.destroy();
    });
  }
}
