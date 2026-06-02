import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config';
import { audio } from '../systems/audio';
import { run, useContinue } from '../state';
import { makeButton, MenuButton, pixelText } from '../ui';
import { GameScene } from './GameScene';

const COUNTDOWN_SECONDS = 9;

/** Game-over overlay with an arcade-style continue countdown. */
export class GameOverScene extends Phaser.Scene {
  private buttons: MenuButton[] = [];
  private selected = 0;
  private countText?: Phaser.GameObjects.Text;
  private remaining = COUNTDOWN_SECONDS;
  private timer?: Phaser.Time.TimerEvent;

  constructor() {
    super(SCENES.GameOver);
  }

  create(): void {
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x12030a, 0.78).setOrigin(0).setDepth(0);
    const cx = GAME_WIDTH / 2;
    pixelText(this, cx, 180, 'GAME OVER', 46, 0xff5d73).setShadow(0, 0, '#ff2d55', 18, true, true);
    pixelText(this, cx, 232, `SCORE  ${run.score.toString().padStart(8, '0')}`, 16, 0xffffff);

    this.buttons = [];
    const canContinue = run.continues > 0;

    if (canContinue) {
      pixelText(this, cx, 286, `CREDIT  ${run.continues}`, 13, 0xffe14d);
      this.countText = pixelText(this, cx, 322, '', 14, 0x9fe9ff);
      this.addButton(cx, 372, 'CONTINUE', () => this.continueGame());
      this.addButton(cx, 420, 'QUIT TO TITLE', () => this.quit());
      this.startCountdown();
    } else {
      pixelText(this, cx, 300, 'NO CREDITS LEFT', 14, 0xff8bd0);
      this.addButton(cx, 372, 'TO TITLE', () => this.quit());
    }

    this.setSelected(0);

    const kb = this.input.keyboard;
    kb?.on('keydown-UP', () => this.move(-1));
    kb?.on('keydown-DOWN', () => this.move(1));
    kb?.on('keydown-ENTER', () => this.buttons[this.selected]?.onActivate());
  }

  private startCountdown(): void {
    this.remaining = COUNTDOWN_SECONDS;
    this.updateCount();
    this.timer = this.time.addEvent({
      delay: 1000,
      repeat: COUNTDOWN_SECONDS,
      callback: () => {
        this.remaining -= 1;
        this.updateCount();
        if (this.remaining <= 0) this.quit();
      },
    });
  }

  private updateCount(): void {
    this.countText?.setText(`CONTINUE?  ${Math.max(0, this.remaining)}`);
  }

  private addButton(x: number, y: number, label: string, fn: () => void): MenuButton {
    const idx = this.buttons.length;
    const b = makeButton(this, x, y, label, 26, fn);
    b.label.on(Phaser.Input.Events.POINTER_OVER, () => this.setSelected(idx));
    this.buttons.push(b);
    return b;
  }

  private setSelected(i: number): void {
    this.selected = Phaser.Math.Wrap(i, 0, this.buttons.length);
    this.buttons.forEach((b, j) => b.setSelected(j === this.selected));
  }

  private move(d: number): void {
    audio.uiMove();
    this.setSelected(this.selected + d);
  }

  private continueGame(): void {
    audio.uiConfirm();
    this.timer?.remove();
    useContinue();
    const game = this.scene.get(SCENES.Game) as GameScene;
    this.scene.stop();
    game.scene.restart();
  }

  private quit(): void {
    audio.uiConfirm();
    audio.stopMusic();
    this.timer?.remove();
    this.scene.stop(SCENES.Game);
    this.scene.stop(SCENES.HUD);
    this.scene.stop();
    this.scene.start(SCENES.Menu);
  }
}
