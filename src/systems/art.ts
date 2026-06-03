/**
 * Procedural textures that are still generated at runtime.
 *
 * The ships, enemies, bosses, bullets, pickups and parallax backdrops are now
 * loaded from image files (see `BootScene` + `public/textures/`). What stays
 * procedural here is the cheap / tile-able / additive stuff that is better
 * generated than shipped: the soft glow particle, the single-pixel stars, and
 * the two seamless parallax star tiles.
 */
import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, TEX } from '../config';

function toCss(color: number, alpha = 1): string {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  return `rgba(${r},${g},${b},${alpha})`;
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
 * Generate the remaining procedural textures. Call once during Boot, after the
 * image assets have been queued/loaded (the loaded textures use the same
 * `TEX.*` keys; these fill in the rest).
 */
export function generateAllTextures(scene: Phaser.Scene): void {
  makeGlow(scene, TEX.particle, 24, COLORS.explosion);
  makeStar(scene, TEX.starSmall, 2);
  makeStar(scene, TEX.starBig, 3);
  makeStarTile(scene, TEX.starTileFar, GAME_WIDTH, GAME_HEIGHT, 90, 1, 0.55);
  makeStarTile(scene, TEX.starTileNear, GAME_WIDTH, GAME_HEIGHT, 46, 2, 0.95);
}
