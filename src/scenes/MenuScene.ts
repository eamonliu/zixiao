import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, SCENES, TEX } from '../config';
import { Starfield } from '../systems/Starfield';
import { audio } from '../systems/audio';
import { run, setMuted, setShip, startRun } from '../state';
import { makeButton, makeImageButton, MenuButton, pixelText } from '../ui';
import { SHIP_AXES, SHIPS, shipIndex } from '../ships';

type Page = 'main' | 'practice' | 'ship';

export class MenuScene extends Phaser.Scene {
  private stars!: Starfield;
  private buttons: MenuButton[] = [];
  private extras: Phaser.GameObjects.GameObject[] = [];
  private selected = 0;
  private page: Page = 'main';
  private hint!: Phaser.GameObjects.Text;
  private soundLabel?: Phaser.GameObjects.Text;

  // Ship-select state.
  private pending = { practice: false, startLevel: 0 };
  private shipSel = 0;
  private shipNameLabels: Phaser.GameObjects.Image[] = [];
  private nameBaseScale = 1;
  private shipPreview?: Phaser.GameObjects.Image;
  private shipDesc?: Phaser.GameObjects.Text;
  private radarGfx?: Phaser.GameObjects.Graphics;

  constructor() {
    super(SCENES.Menu);
  }

  create(): void {
    this.stars = new Starfield(this, 0);
    this.stars.setTheme(0);

    // Title — calligraphy image (紫霄雷霆).
    const cx = GAME_WIDTH / 2;
    const title = this.add.image(cx, 150, TEX.txtTitle);
    title.setScale(this.fit(title, 320, 132));
    this.tweens.add({
      targets: title,
      y: 142,
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });
    this.titleText = title;
    // Hi-score.
    this.hiScoreText = pixelText(this, cx, 232, `HI-SCORE  ${run.hiScore.toString().padStart(8, '0')}`, 13, COLORS.hudPink);

    this.buildMain();

    // Controls hint at the bottom.
    this.hint = pixelText(
      this,
      cx,
      GAME_HEIGHT - 56,
      '',
      11,
      0x6f86a8,
    );
    this.hint.setLineSpacing(4);
    this.refreshHint();

    // Keyboard navigation.
    const kb = this.input.keyboard;
    if (kb) {
      kb.on('keydown-UP', () => this.moveSel(-1));
      kb.on('keydown-W', () => this.moveSel(-1));
      kb.on('keydown-DOWN', () => this.moveSel(1));
      kb.on('keydown-S', () => this.moveSel(1));
      kb.on('keydown-LEFT', () => this.cycleShip(-1));
      kb.on('keydown-A', () => this.cycleShip(-1));
      kb.on('keydown-RIGHT', () => this.cycleShip(1));
      kb.on('keydown-D', () => this.cycleShip(1));
      kb.on('keydown-ENTER', () => this.activate());
      kb.on('keydown-SPACE', () => this.activate());
      kb.on('keydown-ESC', () => this.goBack());
    }

    // Any interaction unlocks the audio context.
    this.input.once(Phaser.Input.Events.POINTER_DOWN, () => audio.unlock());
    this.input.keyboard?.once('keydown', () => audio.unlock());

    this.cameras.main.fadeIn(400, 5, 6, 15);
  }

  private titleText?: Phaser.GameObjects.Image;
  private hiScoreText?: Phaser.GameObjects.Text;

  /** Scale a fit-to-box helper for calligraphy images (preserves aspect). */
  private fit(img: Phaser.GameObjects.Image, maxW: number, maxH: number): number {
    return Math.min(maxW / img.width, maxH / img.height);
  }

  // ---- Menu construction ---------------------------------------------------

  private clearButtons(): void {
    for (const b of this.buttons) b.label.destroy();
    this.buttons = [];
    this.soundLabel = undefined;
    for (const e of this.extras) e.destroy();
    this.extras = [];
    this.shipNameLabels = [];
    this.shipPreview = undefined;
    this.shipDesc = undefined;
    this.radarGfx = undefined;
  }

  /** Show/hide the big title + hi-score + bottom hint (the ship screen needs the room). */
  private setHeaderVisible(on: boolean): void {
    this.titleText?.setVisible(on);
    this.hiScoreText?.setVisible(on);
    this.hint?.setVisible(on);
  }

  private buildMain(): void {
    this.page = 'main';
    this.clearButtons();
    this.setHeaderVisible(true);
    const cx = GAME_WIDTH / 2;
    let y = 330;
    const gap = 52;

    this.addButton(cx, y, 'START', 30, () => {
      audio.uiConfirm();
      this.buildShipSelect(false, 0);
    });
    y += gap;
    this.addButton(cx, y, 'PRACTICE', 30, () => {
      audio.uiConfirm();
      this.buildPractice();
    });
    y += gap;
    const soundBtn = this.addButton(cx, y, this.soundText(), 30, () => {
      setMuted(!run.muted);
      audio.setMuted(run.muted);
      audio.uiMove();
      if (this.soundLabel) this.soundLabel.setText(this.soundText());
    });
    this.soundLabel = soundBtn.label as Phaser.GameObjects.Text;

    this.setSelected(0);
    this.refreshHint();
  }

  private buildPractice(): void {
    this.page = 'practice';
    this.clearButtons();
    this.setHeaderVisible(true);
    const cx = GAME_WIDTH / 2;
    let y = 320;
    const gap = 50;

    for (let i = 0; i < 3; i++) {
      this.addButton(cx, y, `LEVEL ${i + 1}`, 28, () => {
        audio.uiConfirm();
        this.buildShipSelect(true, i);
      });
      y += gap;
    }
    this.addButton(cx, y + 8, 'BACK', 22, () => {
      audio.uiMove();
      this.buildMain();
    });

    this.setSelected(0);
  }

  // ---- Ship selection ------------------------------------------------------

  private buildShipSelect(practice: boolean, startLevel: number): void {
    this.page = 'ship';
    this.pending = { practice, startLevel };
    this.clearButtons();
    this.setHeaderVisible(false);
    this.shipSel = shipIndex(run.shipId);
    const cx = GAME_WIDTH / 2;

    // Heading — calligraphy 选择战机.
    const head = this.add.image(cx, 58, TEX.txtSelect);
    head.setScale(this.fit(head, 240, 56));
    this.extras.push(head);
    this.extras.push(
      pixelText(this, cx, 88, 'SELECT YOUR FIGHTER', 11, 0x6f86a8),
    );

    // Three name tabs (calligraphy 青鸾 / 毕方 / 穷奇).
    const tabXs = [cx - 128, cx, cx + 128];
    const nameTexById: Record<string, string> = {
      qingluan: TEX.txtShipQingluan,
      bifang: TEX.txtShipBifang,
      qiongqi: TEX.txtShipQiongqi,
    };
    this.shipNameLabels = SHIPS.map((s, i) => {
      const img = this.add.image(tabXs[i], 124, nameTexById[s.id]);
      this.nameBaseScale = this.fit(img, 92, 58);
      img.setScale(this.nameBaseScale);
      img.setInteractive({ useHandCursor: true });
      img.on(Phaser.Input.Events.POINTER_OVER, () => this.selectShip(i));
      img.on(Phaser.Input.Events.POINTER_DOWN, () => this.selectShip(i));
      this.extras.push(img);
      return img;
    });

    // Ship preview sprite (pixel art scaled up).
    this.shipPreview = this.add.image(cx, 196, SHIPS[this.shipSel].texture).setScale(4.5);
    this.extras.push(this.shipPreview);

    // Class + flavour line.
    this.shipDesc = pixelText(this, cx, 270, '', 12, 0x9fb6d8);
    this.shipDesc.setLineSpacing(5);
    this.extras.push(this.shipDesc);

    // Radar (spider) chart.
    const radarCY = 430;
    const radarR = 104;
    this.radarGfx = this.add.graphics();
    this.extras.push(this.radarGfx);
    this.drawRadarFrame(cx, radarCY, radarR);
    // Static axis labels around the web.
    SHIP_AXES.forEach((ax, i) => {
      const ang = -Math.PI / 2 + (i / SHIP_AXES.length) * Math.PI * 2;
      const lx = cx + Math.cos(ang) * (radarR + 22);
      const ly = radarCY + Math.sin(ang) * (radarR + 18);
      this.extras.push(pixelText(this, lx, ly, ax.label, 13, 0xbcd0ec));
    });
    this.radarCenter = { x: cx, y: radarCY, r: radarR };

    // Inline control hint (the bottom gameplay hint is hidden on this page).
    this.hint.setVisible(false);
    this.extras.push(
      pixelText(this, cx, 582, '← →  /  A D  切换战机', 11, 0x6f86a8),
    );

    // Confirm + back buttons (calligraphy 出击 / 返回).
    this.addImageButton(cx, GAME_HEIGHT - 90, TEX.txtSortie, 150, 60, () => this.confirmShip());
    this.addImageButton(cx, GAME_HEIGHT - 44, TEX.txtBack, 108, 44, () => this.goBack());

    this.setSelected(0);
    this.refreshShip();
  }

  private radarCenter = { x: 0, y: 0, r: 0 };

  private selectShip(i: number): void {
    const n = SHIPS.length;
    const next = ((i % n) + n) % n;
    if (next === this.shipSel) return;
    this.shipSel = next;
    audio.uiMove();
    this.refreshShip();
  }

  private cycleShip(dir: number): void {
    if (this.page !== 'ship') return;
    this.selectShip(this.shipSel + dir);
  }

  private confirmShip(): void {
    audio.uiConfirm();
    setShip(SHIPS[this.shipSel].id);
    startRun(this.pending.practice, this.pending.startLevel);
    this.launchGame();
  }

  private refreshShip(): void {
    const ship = SHIPS[this.shipSel];

    // Highlight the active tab.
    this.shipNameLabels.forEach((img, i) => {
      const on = i === this.shipSel;
      img.setScale(this.nameBaseScale * (on ? 1.18 : 0.9));
      img.setAlpha(on ? 1 : 0.5);
    });

    this.shipPreview?.setTexture(ship.texture);
    this.shipDesc?.setText(`${ship.klass}\n${ship.blurb}`);

    // Redraw the filled polygon for this ship's stats.
    this.drawRadarFrame(this.radarCenter.x, this.radarCenter.y, this.radarCenter.r);
    this.drawRadarValues(ship.color);
  }

  /** Concentric web + spokes (the static backdrop of the radar). */
  private drawRadarFrame(cx: number, cy: number, r: number): void {
    const g = this.radarGfx;
    if (!g) return;
    g.clear();
    const n = SHIP_AXES.length;
    const ringColor = 0x2c3a5c;
    for (let ring = 1; ring <= 4; ring++) {
      const rr = (r * ring) / 4;
      g.lineStyle(1, ringColor, ring === 4 ? 0.9 : 0.5);
      g.beginPath();
      for (let i = 0; i <= n; i++) {
        const ang = -Math.PI / 2 + (i / n) * Math.PI * 2;
        const x = cx + Math.cos(ang) * rr;
        const y = cy + Math.sin(ang) * rr;
        if (i === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.strokePath();
    }
    g.lineStyle(1, ringColor, 0.7);
    for (let i = 0; i < n; i++) {
      const ang = -Math.PI / 2 + (i / n) * Math.PI * 2;
      g.beginPath();
      g.moveTo(cx, cy);
      g.lineTo(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r);
      g.strokePath();
    }
  }

  /** Filled stat polygon for the selected ship. */
  private drawRadarValues(color: number): void {
    const g = this.radarGfx;
    if (!g) return;
    const { x: cx, y: cy, r } = this.radarCenter;
    const n = SHIP_AXES.length;
    const ship = SHIPS[this.shipSel];
    const pts: Phaser.Math.Vector2[] = [];
    for (let i = 0; i < n; i++) {
      const v = Phaser.Math.Clamp(ship.radar[SHIP_AXES[i].key], 0.05, 1);
      const ang = -Math.PI / 2 + (i / n) * Math.PI * 2;
      pts.push(new Phaser.Math.Vector2(cx + Math.cos(ang) * r * v, cy + Math.sin(ang) * r * v));
    }
    g.fillStyle(color, 0.28);
    g.fillPoints(pts, true);
    g.lineStyle(2, color, 1);
    g.strokePoints(pts, true);
    g.fillStyle(0xffffff, 1);
    for (const p of pts) g.fillCircle(p.x, p.y, 2.5);
  }

  private addButton(
    x: number,
    y: number,
    label: string,
    size: number,
    onActivate: () => void,
  ): MenuButton {
    const idx = this.buttons.length;
    const btn = makeButton(this, x, y, label, size, onActivate);
    btn.label.on(Phaser.Input.Events.POINTER_OVER, () => this.setSelected(idx));
    this.buttons.push(btn);
    return btn;
  }

  private addImageButton(
    x: number,
    y: number,
    texKey: string,
    maxW: number,
    maxH: number,
    onActivate: () => void,
  ): MenuButton {
    const idx = this.buttons.length;
    const btn = makeImageButton(this, x, y, texKey, maxW, maxH, onActivate);
    btn.label.on(Phaser.Input.Events.POINTER_OVER, () => this.setSelected(idx));
    this.buttons.push(btn);
    return btn;
  }

  // ---- Navigation ----------------------------------------------------------

  private setSelected(i: number): void {
    this.selected = Phaser.Math.Wrap(i, 0, this.buttons.length);
    this.buttons.forEach((b, j) => b.setSelected(j === this.selected));
  }

  private moveSel(dir: number): void {
    audio.uiMove();
    this.setSelected(this.selected + dir);
  }

  private activate(): void {
    this.buttons[this.selected]?.onActivate();
  }

  /** ESC / BACK behaviour, page-aware. */
  private goBack(): void {
    if (this.page === 'ship') {
      audio.uiMove();
      if (this.pending.practice) this.buildPractice();
      else this.buildMain();
    } else if (this.page === 'practice') {
      this.buildMain();
    }
  }

  private soundText(): string {
    return run.muted ? 'SOUND: OFF' : 'SOUND: ON';
  }

  private refreshHint(): void {
    if (!this.hint) return;
    this.hint.setText(
      [
        'PC:  方向键/WASD 移动 · SHIFT 精确 · X/空格 炸弹',
        '平板:  拖拽移动 · 屏上按钮 炸弹/精确',
        '自动开火 · 击落敌机拾取强化',
      ].join('\n'),
    );
  }

  private launchGame(): void {
    this.cameras.main.fadeOut(280, 5, 6, 15);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(SCENES.Game);
    });
  }

  update(_t: number, dt: number): void {
    this.stars.update(dt);
  }
}
