/**
 * Procedural pixel-art texture generation.
 *
 * Every visual in the game is drawn here at boot time — no external image
 * assets. Small sprites (ships, bullets, pickups) are authored as ASCII pixel
 * grids; large/organic things (bosses, particles, stars) are drawn with the
 * Canvas 2D API.
 *
 * paintGrid() centres each row horizontally, so as long as each row is itself
 * left-right symmetric (a palindrome) the whole sprite stays centred — rows
 * don't need to share a length and there's no fiddly pixel counting to get
 * wrong.
 */
import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, TEX } from '../config';

type CharMap = Record<string, number>;

function toCss(color: number, alpha = 1): string {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Paint an ASCII pixel grid into a named canvas texture. '.'/' ' = transparent. */
function paintGrid(
  scene: Phaser.Scene,
  key: string,
  grid: string[],
  map: CharMap,
  scale = 2,
): void {
  const cols = grid.reduce((m, r) => Math.max(m, r.length), 0);
  const w = cols * scale;
  const h = grid.length * scale;
  const tex = scene.textures.createCanvas(key, w, h);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.clearRect(0, 0, w, h);
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    const offset = Math.floor((cols - row.length) / 2);
    for (let x = 0; x < row.length; x++) {
      const color = map[row[x]];
      if (color === undefined) continue; // transparent
      ctx.fillStyle = toCss(color);
      ctx.fillRect((x + offset) * scale, y * scale, scale, scale);
    }
  }
  tex.refresh();
}

/** Soft additive glow blob — reused for explosions, engine trails, bullet cores. */
function makeGlow(scene: Phaser.Scene, key: string, size: number, color: number): void {
  const tex = scene.textures.createCanvas(key, size, size);
  if (!tex) return;
  const ctx = tex.getContext();
  const r = size / 2;
  const grad = ctx.createRadialGradient(r, r, 0, r, r, r);
  grad.addColorStop(0, toCss(0xffffff, 1));
  grad.addColorStop(0.35, toCss(color, 0.95));
  grad.addColorStop(0.7, toCss(color, 0.35));
  grad.addColorStop(1, toCss(color, 0));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  tex.refresh();
}

function makeStar(scene: Phaser.Scene, key: string, size: number): void {
  const tex = scene.textures.createCanvas(key, size, size);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.fillStyle = toCss(COLORS.star, 1);
  ctx.fillRect(0, 0, size, size);
  tex.refresh();
}

/** Seamless star tile used by parallax TileSprites. */
function makeStarTile(
  scene: Phaser.Scene,
  key: string,
  w: number,
  h: number,
  count: number,
  maxSize: number,
  baseAlpha: number,
): void {
  const tex = scene.textures.createCanvas(key, w, h);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.clearRect(0, 0, w, h);
  for (let i = 0; i < count; i++) {
    const x = Math.floor(Math.random() * w);
    const y = Math.floor(Math.random() * h);
    const s = 1 + Math.floor(Math.random() * maxSize);
    const a = baseAlpha * (0.4 + Math.random() * 0.6);
    // A few stars get a faint cool tint for depth.
    const c = Math.random() < 0.18 ? 0xbfe6ff : Math.random() < 0.1 ? 0xffd9f2 : COLORS.star;
    ctx.fillStyle = toCss(c, a);
    ctx.fillRect(x, y, s, s);
  }
  tex.refresh();
}

/**
 * Boss texture — a wide armoured battleship pointing down, drawn with mirrored
 * polygons so it reads as bilaterally symmetric. `core` is the bright weakpoint.
 */
function makeBoss(
  scene: Phaser.Scene,
  key: string,
  hull: number,
  dark: number,
  core: number,
  variant: number,
): void {
  const w = 168;
  const h = 132;
  const g = scene.add.graphics();
  const cx = w / 2;

  // Hull silhouette (top wide, tapering down toward the player).
  g.fillStyle(dark, 1);
  g.fillRoundedRect(8, 8, w - 16, h - 40, 14);
  g.fillStyle(hull, 1);
  g.fillRoundedRect(16, 14, w - 32, h - 54, 12);

  // Shoulder pods (mirrored).
  for (const s of [-1, 1]) {
    const px = cx + s * (w / 2 - 26);
    g.fillStyle(dark, 1);
    g.fillCircle(px, 40, 22);
    g.fillStyle(hull, 1);
    g.fillCircle(px, 40, 15);
    g.fillStyle(core, 1);
    g.fillCircle(px, 40, 6);
  }

  // Panel lines for a bit of mechanical detail.
  g.lineStyle(2, dark, 0.9);
  for (let i = 1; i <= 3; i++) {
    const yy = 22 + i * 14;
    g.lineBetween(28, yy, w - 28, yy);
  }
  if (variant >= 1) {
    g.lineStyle(2, dark, 0.7);
    g.lineBetween(cx, 18, cx, h - 40);
  }

  // Central prow + the glowing core weakpoint.
  g.fillStyle(hull, 1);
  g.fillTriangle(cx - 30, h - 38, cx + 30, h - 38, cx, h - 6);
  g.fillStyle(dark, 1);
  g.fillTriangle(cx - 18, h - 36, cx + 18, h - 36, cx, h - 14);
  g.fillStyle(core, 1);
  g.fillCircle(cx, h - 52, variant === 2 ? 18 : 14);
  g.fillStyle(0xffffff, 0.85);
  g.fillCircle(cx, h - 56, 5);

  g.generateTexture(key, w, h);
  g.destroy();
}

// ---- Parallax background features ----------------------------------------

interface PlanetOpts {
  size: number;
  base: number;
  light: number;
  shadow: number;
  atmosphere: number;
  bands?: boolean;
  craters?: boolean;
  ring?: number;
}

function drawPlanetRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color: number,
  back: boolean,
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.36);
  ctx.scale(1, 0.32);
  for (let i = 0; i < 3; i++) {
    const rr = r * (1.32 + i * 0.14);
    ctx.beginPath();
    if (back) ctx.arc(0, 0, rr, Math.PI, Math.PI * 2);
    else ctx.arc(0, 0, rr, 0, Math.PI);
    ctx.strokeStyle = toCss(color, 0.5 - i * 0.12);
    ctx.lineWidth = r * 0.06;
    ctx.stroke();
  }
  ctx.restore();
}

/** A lit, atmospheric planet (optionally ringed) drawn to a canvas texture. */
function makePlanet(scene: Phaser.Scene, key: string, o: PlanetOpts): void {
  const D = o.size;
  const pad = Math.floor(D * (o.ring !== undefined ? 0.55 : 0.2));
  const W = D + pad * 2;
  const tex = scene.textures.createCanvas(key, W, W);
  if (!tex) return;
  const ctx = tex.getContext();
  const cx = W / 2;
  const cy = W / 2;
  const r = D / 2;
  ctx.clearRect(0, 0, W, W);

  // Outer atmosphere glow.
  const glow = ctx.createRadialGradient(cx, cy, r * 0.92, cx, cy, r * 1.22);
  glow.addColorStop(0, toCss(o.atmosphere, 0));
  glow.addColorStop(0.4, toCss(o.atmosphere, 0.22));
  glow.addColorStop(1, toCss(o.atmosphere, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, W);

  if (o.ring !== undefined) drawPlanetRing(ctx, cx, cy, r, o.ring, true);

  // Disc.
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = toCss(o.base);
  ctx.fillRect(cx - r, cy - r, D, D);

  // Day-side highlight (light from top-left).
  const lx = cx - r * 0.42;
  const ly = cy - r * 0.46;
  const lg = ctx.createRadialGradient(lx, ly, r * 0.08, lx, ly, r * 1.55);
  lg.addColorStop(0, toCss(o.light, 0.7));
  lg.addColorStop(0.5, toCss(o.light, 0));
  ctx.fillStyle = lg;
  ctx.fillRect(cx - r, cy - r, D, D);

  if (o.bands) {
    let yy = cy - r;
    while (yy < cy + r) {
      const h = 4 + Math.random() * 12;
      ctx.fillStyle = toCss(Math.random() < 0.5 ? o.shadow : o.light, 0.06 + Math.random() * 0.1);
      ctx.fillRect(cx - r, yy, D, h);
      yy += h + Math.random() * 6;
    }
  }
  if (o.craters) {
    for (let i = 0; i < 46; i++) {
      const a = Math.random() * Math.PI * 2;
      const rr = Math.random() * r * 0.94;
      const px = cx + Math.cos(a) * rr;
      const py = cy + Math.sin(a) * rr;
      const cs = 2 + Math.random() * 8;
      ctx.fillStyle = toCss(o.shadow, 0.16);
      ctx.beginPath();
      ctx.arc(px, py, cs, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = toCss(o.light, 0.12);
      ctx.beginPath();
      ctx.arc(px - cs * 0.3, py - cs * 0.3, cs * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Night side.
  const tg = ctx.createRadialGradient(cx + r * 0.5, cy + r * 0.55, r * 0.15, cx + r * 0.5, cy + r * 0.55, r * 1.7);
  tg.addColorStop(0, toCss(o.shadow, 0));
  tg.addColorStop(0.5, toCss(o.shadow, 0.5));
  tg.addColorStop(1, toCss(0x000000, 0.88));
  ctx.fillStyle = tg;
  ctx.fillRect(cx - r, cy - r, D, D);
  ctx.restore();

  // Lit limb arc.
  ctx.lineWidth = Math.max(2, D * 0.012);
  ctx.strokeStyle = toCss(o.atmosphere, 0.55);
  ctx.beginPath();
  ctx.arc(cx, cy, r - ctx.lineWidth * 0.5, Math.PI * 0.72, Math.PI * 1.7);
  ctx.stroke();

  if (o.ring !== undefined) drawPlanetRing(ctx, cx, cy, r, o.ring, false);

  tex.refresh();
}

/** A distant capital ship / station drawn with Graphics. */
function makeStarship(
  scene: Phaser.Scene,
  key: string,
  hull: number,
  dark: number,
  light: number,
  glowColor: number,
): void {
  const W = 280;
  const H = 520;
  const g = scene.add.graphics();
  const cx = W / 2;

  g.fillStyle(dark, 1);
  g.fillRoundedRect(cx - 58, 60, 116, H - 170, 16);
  g.fillStyle(hull, 1);
  g.fillRoundedRect(cx - 42, 76, 84, H - 200, 12);

  // Prow.
  g.fillStyle(dark, 1);
  g.fillTriangle(cx - 58, 66, cx + 58, 66, cx, 6);
  g.fillStyle(hull, 1);
  g.fillTriangle(cx - 40, 72, cx + 40, 72, cx, 24);

  // Hull sections.
  for (const sec of [[150, 156], [248, 138], [330, 118]]) {
    g.fillStyle(dark, 1);
    g.fillRect(cx - sec[1] / 2, sec[0], sec[1], 30);
    g.fillStyle(hull, 1);
    g.fillRect(cx - sec[1] / 2 + 6, sec[0] + 5, sec[1] - 12, 18);
  }

  g.lineStyle(2, dark, 0.85);
  for (let i = 0; i < 10; i++) g.lineBetween(cx - 40, 92 + i * 36, cx + 40, 92 + i * 36);

  // Window lights.
  g.fillStyle(light, 1);
  for (let i = 0; i < 64; i++) {
    const wx = cx + (Math.random() * 2 - 1) * 38;
    const wy = 92 + Math.random() * (H - 250);
    g.fillRect(Math.round(wx), Math.round(wy), 2, 2);
  }

  // Engine nozzles (face the player) with glow.
  for (const ex of [cx - 30, cx, cx + 30]) {
    g.fillStyle(dark, 1);
    g.fillRect(ex - 12, H - 108, 24, 44);
    g.fillStyle(glowColor, 1);
    g.fillCircle(ex, H - 62, 11);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(ex, H - 62, 4);
  }

  g.generateTexture(key, W, H);
  g.destroy();
}

/** Soft, star-flecked nebula cloud (rendered additively). */
function makeNebula(scene: Phaser.Scene, key: string, c1: number, c2: number): void {
  const S = 256;
  const tex = scene.textures.createCanvas(key, S, S);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.clearRect(0, 0, S, S);
  for (let i = 0; i < 12; i++) {
    const x = Math.random() * S;
    const y = Math.random() * S;
    const rr = 40 + Math.random() * 80;
    const c = Math.random() < 0.5 ? c1 : c2;
    const gr = ctx.createRadialGradient(x, y, 0, x, y, rr);
    gr.addColorStop(0, toCss(c, 0.1 + Math.random() * 0.07));
    gr.addColorStop(1, toCss(c, 0));
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, S, S);
  }
  for (let i = 0; i < 24; i++) {
    ctx.fillStyle = toCss(0xffffff, 0.5 + Math.random() * 0.5);
    ctx.fillRect(Math.random() * S, Math.random() * S, 1 + Math.round(Math.random()), 1);
  }
  tex.refresh();
}

/** Irregular rock (asteroid) or angular metal chunk (debris). */
function makeRock(
  scene: Phaser.Scene,
  key: string,
  size: number,
  base: number,
  dark: number,
  light: number,
  metal: boolean,
): void {
  const S = size;
  const tex = scene.textures.createCanvas(key, S, S);
  if (!tex) return;
  const ctx = tex.getContext();
  const cx = S / 2;
  const cy = S / 2;
  ctx.clearRect(0, 0, S, S);

  const n = metal ? 7 : 10;
  const pts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = S * 0.3 + Math.random() * (S * 0.16);
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  const trace = (): void => {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
  };

  trace();
  ctx.fillStyle = toCss(base);
  ctx.fill();

  ctx.save();
  trace();
  ctx.clip();
  const lg = ctx.createLinearGradient(0, 0, S, S);
  lg.addColorStop(0, toCss(light, 0.45));
  lg.addColorStop(0.5, toCss(base, 0));
  lg.addColorStop(1, toCss(dark, 0.55));
  ctx.fillStyle = lg;
  ctx.fillRect(0, 0, S, S);

  if (metal) {
    ctx.strokeStyle = toCss(dark, 0.7);
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      const yy = cy - S * 0.3 + i * (S * 0.2);
      ctx.beginPath();
      ctx.moveTo(cx - S, yy);
      ctx.lineTo(cx + S, yy);
      ctx.stroke();
    }
    ctx.strokeStyle = toCss(light, 0.5);
    ctx.beginPath();
    ctx.moveTo(cx - S * 0.28, cy - S * 0.4);
    ctx.lineTo(cx - S * 0.28, cy + S * 0.4);
    ctx.stroke();
  } else {
    for (let i = 0; i < 8; i++) {
      const px = cx + (Math.random() * 2 - 1) * S * 0.3;
      const py = cy + (Math.random() * 2 - 1) * S * 0.3;
      const cs = 2 + Math.random() * 5;
      ctx.fillStyle = toCss(dark, 0.4);
      ctx.beginPath();
      ctx.arc(px, py, cs, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = toCss(light, 0.25);
      ctx.beginPath();
      ctx.arc(px - cs * 0.3, py - cs * 0.3, cs * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  trace();
  ctx.strokeStyle = toCss(light, 0.5);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  tex.refresh();
}

/** Generate every texture the game uses. Call once during Boot. */
export function generateAllTextures(scene: Phaser.Scene): void {
  // ---- Player ship (nose up) ----------------------------------------------
  paintGrid(
    scene,
    TEX.player,
    [
      '.....W.....',
      '.....0.....',
      '....000....',
      '....0C0....',
      '...00C00...',
      '..000C000..',
      '.0000C0000.',
      '10000C00001',
      '11000C00011',
      '10110C01101',
      '00010C01000',
      '00011C11000',
      '00011011000',
      '00010W01000',
    ],
    { '0': COLORS.playerHull, '1': COLORS.playerHullDark, C: COLORS.playerCockpit, W: COLORS.white },
    2,
  );

  // ---- 毕方 (red medium fighter) — broad arrow, twin tail ------------------
  paintGrid(
    scene,
    TEX.shipBifang,
    [
      '.....W.....',
      '....0C0....',
      '...00C00...',
      '..010C010..',
      '.0110C0110.',
      '01110C01110',
      '11100C00111',
      '01000C00010',
      '00110C01100',
      '00111W11100',
      '00010.01000',
    ],
    { '0': COLORS.ship2Hull, '1': COLORS.ship2HullDark, C: COLORS.playerCockpit, W: COLORS.white },
    2,
  );

  // ---- 穷奇 (yellow heavy fighter) — wide hull, twin engines ---------------
  paintGrid(
    scene,
    TEX.shipQiongqi,
    [
      '.....WWW.....',
      '....00C00....',
      '...000C000...',
      '.0000CCC0000.',
      '10000CCC00001',
      '11000CCC00011',
      '11100CCC00111',
      '01110C0C01110',
      '00110C0C01100',
      '00010WWW01000',
    ],
    { '0': COLORS.ship3Hull, '1': COLORS.ship3HullDark, C: COLORS.playerCockpit, W: COLORS.white },
    2,
  );

  // ---- Player shot (a bright capsule) -------------------------------------
  paintGrid(
    scene,
    TEX.playerShot,
    ['.X.', 'W0W', '.0.', '.0.', '.W.'],
    { X: COLORS.playerShotCore, W: COLORS.white, '0': COLORS.playerShot },
    2,
  );

  // ---- Enemy: Grunt (nose down, red) --------------------------------------
  paintGrid(
    scene,
    TEX.enemyGrunt,
    [
      '.2.......2.',
      '.212...212.',
      '.21111111112.',
      '..211111112..',
      '...2C1C2...',
      '...21112...',
      '....111....',
      '....212....',
      '.....1.....',
      '.....W.....',
    ],
    { '1': COLORS.enemyA, '2': COLORS.enemyADark, C: COLORS.white, W: COLORS.enemyShotCore },
    2,
  );

  // ---- Enemy: Weaver (sleek, yellow) --------------------------------------
  paintGrid(
    scene,
    TEX.enemyWeaver,
    [
      '.2.......2.',
      '.22.....22.',
      '.221...122.',
      '.2211C1122.',
      '..211C112..',
      '..21C1C12..',
      '...21C12...',
      '...1C1C1...',
      '....1C1....',
      '....1W1....',
      '.....1.....',
    ],
    { '1': COLORS.enemyB, '2': COLORS.enemyBDark, C: COLORS.white, W: COLORS.enemyShotCore },
    2,
  );

  // ---- Enemy: Turret (rounded, purple, stationary) ------------------------
  paintGrid(
    scene,
    TEX.enemyTurret,
    [
      '..22222..',
      '.2111112.',
      '211C1C112',
      '21C111C12',
      '211111112',
      '21C111C12',
      '211C1C112',
      '.2111112.',
      '..22222..',
    ],
    { '1': COLORS.enemyC, '2': COLORS.enemyCDark, C: COLORS.white },
    2,
  );

  // ---- Enemy: Diver (fast arrow, nose down) -------------------------------
  paintGrid(
    scene,
    TEX.enemyDiver,
    [
      '....W....',
      '...212...',
      '..21112..',
      '.2111112.',
      '211111112',
      '21.111.12',
      '1.......1',
    ],
    { '1': COLORS.enemyB, '2': COLORS.enemyA, W: COLORS.white },
    2,
  );

  // ---- Enemy bullets -------------------------------------------------------
  paintGrid(
    scene,
    TEX.enemyShot,
    ['.W.', 'WXW', '.W.'],
    { W: COLORS.enemyShot, X: COLORS.enemyShotCore },
    2,
  );
  paintGrid(
    scene,
    TEX.enemyShotAimed,
    ['.X.', '.X.', 'WXW', '.X.', '.X.'],
    { X: COLORS.enemyShotAimed, W: COLORS.enemyShotCore },
    2,
  );
  paintGrid(
    scene,
    TEX.enemyShotBig,
    ['..W..', '.WXW.', 'WXXXW', '.WXW.', '..W..'],
    { W: COLORS.enemyShot, X: COLORS.enemyShotCore },
    2,
  );

  // ---- Pickups -------------------------------------------------------------
  paintGrid(
    scene,
    TEX.powerUp,
    ['.000.', '0WPW0', '0PWP0', '0WPW0', '.000.'],
    { '0': COLORS.powerUp, W: COLORS.white, P: 0x0a2a18 },
    3,
  );
  paintGrid(
    scene,
    TEX.bombPickup,
    ['.000.', '0WBW0', '0BWB0', '0WBW0', '.000.'],
    { '0': COLORS.bombPickup, W: COLORS.white, B: 0x3a2a05 },
    3,
  );

  // ---- FX & background -----------------------------------------------------
  makeGlow(scene, TEX.particle, 24, COLORS.explosion);
  makeStar(scene, TEX.starSmall, 2);
  makeStar(scene, TEX.starBig, 3);
  makeStarTile(scene, TEX.starTileFar, GAME_WIDTH, GAME_HEIGHT, 90, 1, 0.55);
  makeStarTile(scene, TEX.starTileNear, GAME_WIDTH, GAME_HEIGHT, 46, 2, 0.95);

  // ---- Parallax background features ----------------------------------------
  makePlanet(scene, TEX.planetBlue, {
    size: 300,
    base: 0x2c4a7a,
    light: 0x9fc6ff,
    shadow: 0x0a1530,
    atmosphere: 0x6fb4ff,
    craters: true,
  });
  makePlanet(scene, TEX.planetViolet, {
    size: 320,
    base: 0x4a2c6a,
    light: 0xd8a0ff,
    shadow: 0x140a26,
    atmosphere: 0xb878ff,
    bands: true,
    ring: 0xc9a8ff,
  });
  makeStarship(scene, TEX.starship, COLORS.boss, COLORS.bossDark, 0xbfe6ff, 0x6fd0ff);
  makeNebula(scene, TEX.nebula, 0x3a78ff, 0x9f5dff);
  makeRock(scene, TEX.asteroid1, 64, 0x6b5d52, 0x2a2018, 0xb8a890, false);
  makeRock(scene, TEX.asteroid2, 80, 0x5a5048, 0x241c14, 0xa89880, false);
  makeRock(scene, TEX.asteroid3, 52, 0x77685a, 0x2a2018, 0xc8b8a0, false);
  makeRock(scene, TEX.debris1, 72, 0x6a6f7a, 0x202430, 0xc0d0e0, true);
  makeRock(scene, TEX.debris2, 56, 0x7a5a5a, 0x2a1818, 0xe0b0b0, true);
  makeRock(scene, TEX.debris3, 64, 0x5f6b6a, 0x1c2422, 0xb8d0cc, true);

  // ---- Bosses --------------------------------------------------------------
  makeBoss(scene, TEX.boss1, COLORS.enemyA, COLORS.enemyADark, COLORS.bossCore, 0);
  makeBoss(scene, TEX.boss2, COLORS.boss, COLORS.bossDark, COLORS.bossCore, 1);
  makeBoss(scene, TEX.boss3, COLORS.enemyC, COLORS.enemyCDark, COLORS.bossCore, 2);
}
