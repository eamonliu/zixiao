import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config';
import { audio } from '../systems/audio';
import { run, setMuted } from '../state';
import { makeButton, MenuButton, pixelText } from '../ui';

/** Pause overlay shown on top of a paused GameScene. */
export class PauseScene extends Phaser.Scene {
  private buttons: MenuButton[] = [];
  private selected = 0;
  private soundLabel?: Phaser.GameObjects.Text;

  constructor() {
    super(SCENES.Pause);
  }

  create(): void {
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x05060f, 0.72).setOrigin(0).setDepth(0);
    const cx = GAME_WIDTH / 2;
    pixelText(this, cx, 200, 'PAUSED', 44, 0x9fe9ff).setShadow(0, 0, '#3bd6ff', 18, true, true);

    this.buttons = [];
    this.addButton(cx, 320, 'RESUME', () => this.resume());
    const snd = this.addButton(cx, 372, this.soundText(), () => {
      setMuted(!run.muted);
      audio.setMuted(run.muted);
      this.soundLabel?.setText(this.soundText());
    });
    this.soundLabel = snd.label;
    this.addButton(cx, 424, 'QUIT TO TITLE', () => this.quit());

    this.setSelected(0);

    const kb = this.input.keyboard;
    kb?.on('keydown-UP', () => this.move(-1));
    kb?.on('keydown-DOWN', () => this.move(1));
    kb?.on('keydown-ENTER', () => this.buttons[this.selected]?.onActivate());
    kb?.on('keydown-ESC', () => this.resume());
    kb?.on('keydown-P', () => this.resume());
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

  private soundText(): string {
    return run.muted ? 'SOUND: OFF' : 'SOUND: ON';
  }

  private resume(): void {
    audio.uiConfirm();
    this.scene.stop();
    this.scene.resume(SCENES.Game);
  }

  private quit(): void {
    audio.uiConfirm();
    audio.stopMusic();
    this.scene.stop(SCENES.Game);
    this.scene.stop(SCENES.HUD);
    this.scene.stop();
    this.scene.start(SCENES.Menu);
  }
}
