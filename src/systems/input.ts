/**
 * Unified input for desktop (keyboard + mouse) and tablet (touch).
 *
 * Desktop: arrows / WASD to move, Shift to focus (precision), X or Space to
 * bomb, Esc / P to pause. Auto-fire is always on, so there is no shoot key.
 *
 * Tablet: drag anywhere in the playfield to move the ship relatively (the ship
 * keeps its offset from the finger so it is never hidden under it). On-screen
 * HUD buttons drive bomb / focus / pause; those button rectangles are
 * registered as "deadzones" so touching them never also moves the ship.
 */
import Phaser from 'phaser';
import { audio } from './audio';

export class InputManager {
  private scene: Phaser.Scene;
  private kb?: Phaser.Input.Keyboard.KeyboardPlugin;

  private up: Phaser.Input.Keyboard.Key[] = [];
  private down: Phaser.Input.Keyboard.Key[] = [];
  private left: Phaser.Input.Keyboard.Key[] = [];
  private right: Phaser.Input.Keyboard.Key[] = [];
  private focusKeys: Phaser.Input.Keyboard.Key[] = [];
  private bombKeys: Phaser.Input.Keyboard.Key[] = [];
  private pauseKeys: Phaser.Input.Keyboard.Key[] = [];

  private deadzones: Phaser.Geom.Rectangle[] = [];
  private ignored = new Set<number>();

  // Primary pointer (the one that drives movement).
  primaryId: number | null = null;
  pActive = false;
  pJustDown = false;
  px = 0;
  py = 0;
  private lastPx = 0;
  private lastPy = 0;
  pSpeed = 0;

  // Fed by HUD buttons.
  private focusToggle = false;
  private pendingBomb = false;
  private pendingPause = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.kb = scene.input.keyboard ?? undefined;

    if (this.kb) {
      const K = Phaser.Input.Keyboard.KeyCodes;
      const add = (code: number) => this.kb!.addKey(code, true, false);
      this.up = [add(K.UP), add(K.W)];
      this.down = [add(K.DOWN), add(K.S)];
      this.left = [add(K.LEFT), add(K.A)];
      this.right = [add(K.RIGHT), add(K.D)];
      this.focusKeys = [add(K.SHIFT)];
      this.bombKeys = [add(K.X), add(K.SPACE)];
      this.pauseKeys = [add(K.ESC), add(K.P)];
    }

    // Allow a few simultaneous touches (move + focus/bomb buttons).
    scene.input.addPointer(2);

    scene.input.on(Phaser.Input.Events.POINTER_DOWN, this.onPointerDown, this);
    scene.input.on(Phaser.Input.Events.POINTER_MOVE, this.onPointerMove, this);
    scene.input.on(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  /** HUD registers its button rects so touches there don't move the ship. */
  addDeadzone(rect: Phaser.Geom.Rectangle): void {
    this.deadzones.push(rect);
  }

  private inDeadzone(x: number, y: number): boolean {
    return this.deadzones.some((r) => r.contains(x, y));
  }

  private onPointerDown(p: Phaser.Input.Pointer): void {
    audio.unlock();
    if (this.inDeadzone(p.x, p.y)) {
      this.ignored.add(p.id);
      return;
    }
    if (this.primaryId === null) {
      this.primaryId = p.id;
      this.pActive = true;
      this.pJustDown = true;
      this.px = this.lastPx = p.x;
      this.py = this.lastPy = p.y;
      this.pSpeed = 0;
    }
  }

  private onPointerMove(p: Phaser.Input.Pointer): void {
    if (p.id === this.primaryId) {
      this.px = p.x;
      this.py = p.y;
    }
  }

  private onPointerUp(p: Phaser.Input.Pointer): void {
    this.ignored.delete(p.id);
    if (p.id === this.primaryId) {
      this.primaryId = null;
      this.pActive = false;
    }
  }

  // ---- HUD button hooks ----------------------------------------------------
  triggerBomb(): void {
    this.pendingBomb = true;
  }
  triggerPause(): void {
    this.pendingPause = true;
  }
  setFocusButton(on: boolean): void {
    this.focusToggle = on;
  }
  toggleFocusButton(): boolean {
    this.focusToggle = !this.focusToggle;
    return this.focusToggle;
  }

  // ---- Queries (read once per frame from the Player/Scene) -----------------

  /** Keyboard movement vector, components in -1..1 (not normalised). */
  kbVec(): { x: number; y: number } {
    let x = 0;
    let y = 0;
    if (this.left.some((k) => k.isDown)) x -= 1;
    if (this.right.some((k) => k.isDown)) x += 1;
    if (this.up.some((k) => k.isDown)) y -= 1;
    if (this.down.some((k) => k.isDown)) y += 1;
    return { x, y };
  }

  hasKeyboardMove(): boolean {
    const v = this.kbVec();
    return v.x !== 0 || v.y !== 0;
  }

  focus(): boolean {
    return this.focusToggle || this.focusKeys.some((k) => k.isDown);
  }

  /** True once per bomb request (key edge or HUD button). Consumes the event. */
  consumeBomb(): boolean {
    let pressed = this.pendingBomb;
    this.pendingBomb = false;
    for (const k of this.bombKeys) {
      if (Phaser.Input.Keyboard.JustDown(k)) pressed = true;
    }
    return pressed;
  }

  consumePause(): boolean {
    let pressed = this.pendingPause;
    this.pendingPause = false;
    for (const k of this.pauseKeys) {
      if (Phaser.Input.Keyboard.JustDown(k)) pressed = true;
    }
    return pressed;
  }

  /** Consume the "pointer just pressed" edge (Player uses it to re-anchor drag). */
  consumePointerJustDown(): boolean {
    const v = this.pJustDown;
    this.pJustDown = false;
    return v;
  }

  /** Call at the end of each frame to update pointer speed bookkeeping. */
  lateUpdate(dtMs: number): void {
    if (this.pActive && dtMs > 0) {
      const dx = this.px - this.lastPx;
      const dy = this.py - this.lastPy;
      this.pSpeed = Math.hypot(dx, dy) / (dtMs / 1000);
    } else {
      this.pSpeed = 0;
    }
    this.lastPx = this.px;
    this.lastPy = this.py;
  }

  destroy(): void {
    this.scene.input.off(Phaser.Input.Events.POINTER_DOWN, this.onPointerDown, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_MOVE, this.onPointerMove, this);
    this.scene.input.off(Phaser.Input.Events.POINTER_UP, this.onPointerUp, this);
  }
}
