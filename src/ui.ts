/**
 * Tiny UI helpers shared by the menu / pause / results screens. Uses a
 * monospace system font styled to read as crisp arcade text (no bitmap-font
 * asset needed).
 */
import Phaser from 'phaser';

const FONT = 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace';

function hex(n: number): string {
  return '#' + n.toString(16).padStart(6, '0');
}

export function pixelText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  content: string,
  size: number,
  color = 0xffffff,
): Phaser.GameObjects.Text {
  const t = scene.add.text(x, y, content, {
    fontFamily: FONT,
    fontSize: `${size}px`,
    color: hex(color),
    align: 'center',
  });
  t.setOrigin(0.5);
  t.setResolution(2);
  return t;
}

export interface MenuButton {
  /** The clickable node — a Text for word buttons, an Image for calligraphy buttons. */
  label: Phaser.GameObjects.GameObject;
  setSelected(on: boolean): void;
  readonly onActivate: () => void;
}

/**
 * A selectable text button with hover/selection highlight. Activation is wired
 * by the owning scene (keyboard Enter on the selected item, or pointer tap).
 */
export function makeButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  size: number,
  onActivate: () => void,
): MenuButton {
  const text = pixelText(scene, x, y, label, size, 0x9fb6d6);
  text.setInteractive({ useHandCursor: true });

  const btn: MenuButton = {
    label: text,
    onActivate,
    setSelected(on: boolean) {
      text.setColor(on ? '#ffffff' : '#9fb6d6');
      text.setScale(on ? 1.08 : 1);
      text.setShadow(0, 0, on ? '#9fe9ff' : '#000000', on ? 12 : 0, true, true);
    },
  };
  btn.setSelected(false);
  // Selection highlight is managed by the owning scene so keyboard and pointer
  // stay in sync; here we only wire activation.
  text.on(Phaser.Input.Events.POINTER_UP, () => onActivate());

  return btn;
}

/**
 * Like makeButton, but the label is a pre-rendered image (used for the
 * Chinese calligraphy buttons). Scaled to fit within maxW×maxH, with a
 * scale/alpha pop on selection.
 */
export function makeImageButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  textureKey: string,
  maxW: number,
  maxH: number,
  onActivate: () => void,
): MenuButton {
  const img = scene.add.image(x, y, textureKey);
  const base = Math.min(maxW / img.width, maxH / img.height);
  img.setInteractive({ useHandCursor: true });

  const btn: MenuButton = {
    label: img,
    onActivate,
    setSelected(on: boolean) {
      img.setScale(on ? base * 1.12 : base);
      img.setAlpha(on ? 1 : 0.72);
    },
  };
  btn.setSelected(false);
  img.on(Phaser.Input.Events.POINTER_UP, () => onActivate());

  return btn;
}
