import Phaser from 'phaser';
import { SCENES } from '../config';
import { generateAllTextures } from '../systems/art';
import { audio } from '../systems/audio';
import { run } from '../state';

/** Generates every procedural texture, then hands off to the menu. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.Boot);
  }

  create(): void {
    generateAllTextures(this);
    audio.setMuted(run.muted);
    this.scene.start(SCENES.Menu);
  }
}
