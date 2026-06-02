import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, PLAYER, SCENES, TEX } from '../config';
import { run } from '../state';
import { GameScene } from './GameScene';
import { InputManager } from '../systems/input';

const PAD = 12;

/** Heads-up display overlay + on-screen touch controls. Reads from GameScene. */
export class HUDScene extends Phaser.Scene {
  private gameScene!: GameScene;
  private wiredInput?: InputManager;

  private scoreText!: Phaser.GameObjects.Text;
  private hiText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private powerText!: Phaser.GameObjects.Text;
  private lifeIcons: Phaser.GameObjects.Image[] = [];
  private bombIcons: Phaser.GameObjects.Image[] = [];

  private bossWrap!: Phaser.GameObjects.Container;
  private bossName!: Phaser.GameObjects.Text;
  private bossBarBg!: Phaser.GameObjects.Rectangle;
  private bossBar!: Phaser.GameObjects.Rectangle;
  private bossPips!: Phaser.GameObjects.Text;

  private focusBtnRing!: Phaser.GameObjects.Arc;
  private focusOn = false;
  private pendingDeadzones: Phaser.Geom.Rectangle[] = [];

  constructor() {
    super(SCENES.HUD);
  }

  create(): void {
    this.gameScene = this.scene.get(SCENES.Game) as GameScene;

    const mono = 'ui-monospace, Menlo, monospace';
    this.scoreText = this.add
      .text(PAD, PAD, '', { fontFamily: mono, fontSize: '15px', color: '#ffffff' })
      .setResolution(2)
      .setDepth(100);
    this.hiText = this.add
      .text(GAME_WIDTH - PAD, PAD, '', { fontFamily: mono, fontSize: '12px', color: '#ff8bd0' })
      .setOrigin(1, 0)
      .setResolution(2)
      .setDepth(100);
    this.comboText = this.add
      .text(PAD, PAD + 22, '', { fontFamily: mono, fontSize: '12px', color: '#fff7a8' })
      .setResolution(2)
      .setDepth(100);

    // Lives & bombs icon rows (bottom-left).
    for (let i = 0; i < PLAYER.maxLives; i++) {
      const ic = this.add
        .image(PAD + 8 + i * 18, GAME_HEIGHT - 40, TEX.player)
        .setScale(0.7)
        .setDepth(100)
        .setVisible(false);
      this.lifeIcons.push(ic);
    }
    for (let i = 0; i < PLAYER.maxBombs; i++) {
      const ic = this.add
        .image(PAD + 8 + i * 16, GAME_HEIGHT - 20, TEX.bombPickup)
        .setScale(0.55)
        .setDepth(100)
        .setVisible(false);
      this.bombIcons.push(ic);
    }
    this.powerText = this.add
      .text(PAD, GAME_HEIGHT - 60, '', { fontFamily: mono, fontSize: '12px', color: '#8fe7ff' })
      .setResolution(2)
      .setDepth(100);

    this.buildBossBar(mono);
    this.buildTouchControls();

    // If the GameScene restarts (next level), it builds a new InputManager;
    // re-register our button deadzones against it.
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.lifeIcons = [];
      this.bombIcons = [];
    });
  }

  private buildBossBar(mono: string): void {
    const w = GAME_WIDTH - 80;
    this.bossWrap = this.add.container(GAME_WIDTH / 2, 30).setDepth(100).setVisible(false);
    this.bossName = this.add
      .text(0, -12, '', { fontFamily: mono, fontSize: '12px', color: '#ffd0e6' })
      .setOrigin(0.5);
    this.bossPips = this.add
      .text(w / 2, -12, '', { fontFamily: mono, fontSize: '11px', color: '#cfe0ff' })
      .setOrigin(1, 0.5);
    this.bossBarBg = this.add.rectangle(0, 4, w, 7, 0x222a44).setOrigin(0.5);
    this.bossBar = this.add.rectangle(-w / 2, 4, w, 7, COLORS.bossCore).setOrigin(0, 0.5);
    this.bossWrap.add([this.bossName, this.bossPips, this.bossBarBg, this.bossBar]);
  }

  // ---- Touch controls ------------------------------------------------------

  private buildTouchControls(): void {
    // BOMB (bottom-right)
    this.makeButton(GAME_WIDTH - 46, GAME_HEIGHT - 50, 30, 'BOMB', COLORS.bombPickup, () => {
      this.gameScene.inputMgr.triggerBomb();
    });

    // FOCUS toggle (bottom-right, above bomb)
    this.focusBtnRing = this.makeButton(
      GAME_WIDTH - 46,
      GAME_HEIGHT - 118,
      26,
      'FOCUS',
      COLORS.hudCyan,
      () => {
        this.focusOn = this.gameScene.inputMgr.toggleFocusButton();
        this.focusBtnRing.setFillStyle(this.focusOn ? COLORS.hudCyan : 0x000000, this.focusOn ? 0.35 : 0.18);
      },
    );

    // PAUSE (top-right corner, small)
    this.makeButton(GAME_WIDTH - 26, 54, 16, 'II', 0xcfe0ff, () => {
      this.gameScene.inputMgr.triggerPause();
    });
  }

  private makeButton(
    x: number,
    y: number,
    r: number,
    label: string,
    color: number,
    onPress: () => void,
  ): Phaser.GameObjects.Arc {
    const ring = this.add
      .circle(x, y, r, 0x000000, 0.18)
      .setStrokeStyle(2, color, 0.7)
      .setDepth(100);
    this.add
      .text(x, y, label, {
        fontFamily: 'ui-monospace, Menlo, monospace',
        fontSize: `${Math.max(9, r / 2.4)}px`,
        color: '#' + color.toString(16).padStart(6, '0'),
      })
      .setOrigin(0.5)
      .setResolution(2)
      .setDepth(101);
    ring.setInteractive(new Phaser.Geom.Circle(r, r, r), Phaser.Geom.Circle.Contains);
    ring.on(Phaser.Input.Events.POINTER_DOWN, () => {
      onPress();
      this.tweens.add({ targets: ring, scale: 0.86, duration: 70, yoyo: true });
    });
    // The owning GameScene input must ignore touches that begin on this button.
    this.registerDeadzone(new Phaser.Geom.Rectangle(x - r, y - r, r * 2, r * 2));
    return ring;
  }

  private registerDeadzone(rect: Phaser.Geom.Rectangle): void {
    this.pendingDeadzones.push(rect);
  }

  // ---- Update --------------------------------------------------------------

  update(): void {
    if (!this.gameScene || !this.gameScene.scene.isActive()) return;

    // (Re)bind deadzones whenever the GameScene swaps in a fresh InputManager.
    if (this.gameScene.inputMgr && this.wiredInput !== this.gameScene.inputMgr) {
      this.wiredInput = this.gameScene.inputMgr;
      for (const r of this.pendingDeadzones) this.gameScene.inputMgr.addDeadzone(r);
    }

    this.scoreText.setText(`SCORE ${run.score.toString().padStart(8, '0')}`);
    this.hiText.setText(`HI ${Math.max(run.hiScore, run.score).toString().padStart(8, '0')}`);

    const combo = this.gameScene.combo;
    if (combo >= 2) {
      this.comboText.setText(`x${this.gameScene.comboMult.toFixed(2)}  COMBO ${combo}`);
      this.comboText.setVisible(true);
    } else {
      this.comboText.setVisible(false);
    }

    this.powerText.setText(`POWER  L${this.gameScene.playerPower}`);

    // Lives: show (remaining-1) ship icons = spare lives.
    const spares = Math.max(0, run.lives - 1);
    this.lifeIcons.forEach((ic, i) => ic.setVisible(i < spares));
    this.bombIcons.forEach((ic, i) => ic.setVisible(i < run.bombs));

    const bi = this.gameScene.bossInfo;
    if (bi) {
      this.bossWrap.setVisible(true);
      this.bossName.setText(bi.name);
      this.bossPips.setText(`PHASE ${bi.phase + 1}/${bi.phaseCount}`);
      const fullW = GAME_WIDTH - 80;
      this.bossBar.width = fullW * bi.ratio;
    } else {
      this.bossWrap.setVisible(false);
    }
  }
}
