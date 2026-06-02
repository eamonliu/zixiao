import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from './config';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { HUDScene } from './scenes/HUDScene';
import { PauseScene } from './scenes/PauseScene';
import { GameOverScene } from './scenes/GameOverScene';
import { VictoryScene } from './scenes/VictoryScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'app',
  backgroundColor: COLORS.bg0,
  pixelArt: true,
  roundPixels: true,
  // We integrate movement manually (precise circular hitboxes + graze), so no
  // physics engine is enabled — it would only add overhead for hundreds of
  // bullets.
  scale: {
    mode: Phaser.Scale.FIT,
    // Centering is handled by CSS flex on #app. Letting Phaser ALSO auto-center
    // double-applies the offset and pushes the canvas off-centre.
    autoCenter: Phaser.Scale.NO_CENTER,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  // Cap the device pixel ratio so huge-DPR tablets don't tank fill-rate.
  render: {
    antialias: false,
    powerPreference: 'high-performance',
  },
  fps: {
    target: 60,
    min: 30,
  },
  scene: [BootScene, MenuScene, GameScene, HUDScene, PauseScene, GameOverScene, VictoryScene],
};

const game = new Phaser.Game(config);

// Dev convenience: expose the game for debugging/inspection.
(window as unknown as { __game: Phaser.Game }).__game = game;

// Hide the HTML loading splash once the first scene is up.
game.events.once(Phaser.Core.Events.READY, () => {
  const splash = document.getElementById('boot-splash');
  if (splash) splash.classList.add('hidden');
});

export default game;
