import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, SCENES } from '../config';
import { Starfield } from '../systems/Starfield';
import { audio } from '../systems/audio';
import { commitHiScore, run } from '../state';
import { makeButton, pixelText } from '../ui';

/** End-of-run results screen. */
export class VictoryScene extends Phaser.Scene {
  private stars!: Starfield;

  constructor() {
    super(SCENES.Victory);
  }

  create(): void {
    audio.stopMusic();
    const isNew = commitHiScore();

    this.stars = new Starfield(this, 0);
    this.stars.setTheme(2);

    const cx = GAME_WIDTH / 2;
    pixelText(this, cx, 130, 'MISSION', 40, COLORS.hudCyan).setShadow(0, 0, '#3bd6ff', 18, true, true);
    pixelText(this, cx, 178, 'COMPLETE', 40, COLORS.hudCyan).setShadow(0, 0, '#3bd6ff', 18, true, true);

    // 1CC accolade — cleared all three stages, normal mode, no continues.
    const oneCredit = !run.usedContinueThisRun && !run.practice;
    if (oneCredit) {
      const badge = pixelText(this, cx, 240, '★ 1CC CLEAR ★', 20, COLORS.graze);
      this.tweens.add({ targets: badge, scale: 1.12, duration: 700, yoyo: true, repeat: -1 });
    } else if (run.practice) {
      pixelText(this, cx, 240, 'PRACTICE CLEAR', 16, 0x8fb0d8);
    }

    const stats = [
      `SCORE        ${run.score.toString().padStart(8, '0')}`,
      `HI-SCORE     ${run.hiScore.toString().padStart(8, '0')}${isNew ? '  NEW!' : ''}`,
      `ENEMIES      ${run.kills}`,
      `BEST COMBO   ${run.bestCombo}`,
    ];
    pixelText(this, cx, 320, stats.join('\n'), 14, 0xffffff).setLineSpacing(10);

    makeButton(this, cx, GAME_HEIGHT - 90, 'BACK TO TITLE', 24, () => {
      audio.uiConfirm();
      this.scene.start(SCENES.Menu);
    }).setSelected(true);

    this.input.keyboard?.on('keydown-ENTER', () => this.scene.start(SCENES.Menu));
    this.input.keyboard?.on('keydown-ESC', () => this.scene.start(SCENES.Menu));

    this.cameras.main.fadeIn(500, 5, 6, 15);
  }

  update(_t: number, dt: number): void {
    this.stars.update(dt);
  }
}
