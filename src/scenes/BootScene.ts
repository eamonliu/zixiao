import Phaser from 'phaser';
import { SCENES, TEX } from '../config';
import { generateAllTextures } from '../systems/art';
import { audio } from '../systems/audio';
import { run } from '../state';

/** Sprite/background textures loaded from image files (keyed by their TEX.* id). */
const IMAGE_KEYS: string[] = [
  TEX.player, TEX.shipBifang, TEX.shipQiongqi, TEX.playerShot,
  TEX.enemyGrunt, TEX.enemyWeaver, TEX.enemyTurret, TEX.enemyDiver,
  TEX.enemyShot, TEX.enemyShotAimed, TEX.enemyShotBig,
  TEX.powerUp, TEX.bombPickup,
  TEX.boss1, TEX.boss2, TEX.boss3,
  TEX.planetBlue, TEX.planetViolet, TEX.starship, TEX.nebula,
  TEX.asteroid1, TEX.asteroid2, TEX.asteroid3,
  TEX.debris1, TEX.debris2, TEX.debris3,
];

/** Calligraphy theme-text images → their file stem under textures/text/. */
const TEXT_IMAGES: [string, string][] = [
  [TEX.txtTitle, 'title'],
  [TEX.txtSelect, 'select'],
  [TEX.txtShipQingluan, 'ship-qingluan'],
  [TEX.txtShipBifang, 'ship-bifang'],
  [TEX.txtShipQiongqi, 'ship-qiongqi'],
  [TEX.txtSortie, 'sortie'],
  [TEX.txtBack, 'back'],
];

/** Loads the image assets, generates the remaining procedural textures, then hands off. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.Boot);
  }

  preload(): void {
    // File stem == TEX key with the 'tex-' prefix stripped (e.g. tex-boss-1 → boss-1.png).
    for (const key of IMAGE_KEYS) {
      this.load.image(key, `textures/${key.replace('tex-', '')}.png`);
    }
    for (const [key, stem] of TEXT_IMAGES) {
      this.load.image(key, `textures/text/${stem}.png`);
    }
  }

  create(): void {
    generateAllTextures(this);
    audio.setMuted(run.muted);
    this.scene.start(SCENES.Menu);
  }
}
