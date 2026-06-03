#!/usr/bin/env python3
"""Preprocess delivered art (art/incoming) into runtime textures (public/textures).

Drives off art/assets.manifest.json (each asset's `file` + `nativeSize`).

Gameplay sprites are drawn 1.7x larger than their original "native" design size
(see SPRITE_SCALE in src/config.ts). Rather than upscale a native-size texture
at runtime (which looks blurry), we BAKE that factor into the texture here:
each gameplay sprite is generated at native x SPRITE_SCALE straight from the
high-res source (still a downscale, so it stays crisp) and drawn at scale 1 in
the game. Collision radii / world offsets keep the x SPRITE_SCALE factor in code.

- Small gameplay sprites (ships, bullets, enemies, pickups; native max dim
  <= SMALL_MAX) are TRIMMED to their alpha bbox then scaled to FILL the target
  box (aspect preserved, centred). The delivered AI art carries empty margins;
  trimming makes the visible sprite fill its on-screen budget.
- Bosses fill their frame already -> plain high-quality resize to the target.
- Backgrounds (planets, starship, nebula, asteroids, debris) are NOT enlarged
  (scale 1.0): plain resize to native size.
- The 3 enemies drawn nose-UP are rotated 180 deg so they face down.
- `keep-procedural` assets (star tiles/dots, glow particle) are left to art.ts.
- Calligraphy theme text is copied at delivered resolution (downscaled in-engine).

Run from the project root:  python3 scripts/process-art.py
"""
import json
import os
import re
import shutil
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INCOMING = os.path.join(ROOT, "art", "incoming")
OUT_DIR = os.path.join(ROOT, "public", "textures")
OUT_TEXT = os.path.join(OUT_DIR, "text")
MANIFEST = os.path.join(ROOT, "art", "assets.manifest.json")
CONFIG_TS = os.path.join(ROOT, "src", "config.ts")

# Sprites whose native max dimension is <= this are the small gameplay sprites
# (trim-to-content then fill the box). Bosses are gameplay too but bigger.
SMALL_MAX = 30

# Enemies generated nose-up that must face down in-game.
FLIP = {"enemy-grunt.png", "enemy-weaver.png", "enemy-diver.png"}

TEXT_FILES = ["title", "select", "ship-qingluan", "ship-bifang",
              "ship-qiongqi", "sortie", "back"]


def read_sprite_scale():
    """Single source of truth: the SPRITE_SCALE constant in src/config.ts."""
    m = re.search(r"SPRITE_SCALE\s*=\s*([0-9.]+)", open(CONFIG_TS).read())
    if not m:
        raise SystemExit("could not read SPRITE_SCALE from src/config.ts")
    return float(m.group(1))


def is_gameplay(file, w, h):
    """Gameplay sprites (ships/bullets/enemies/pickups/bosses) are enlarged by
    SPRITE_SCALE; parallax backgrounds keep native size."""
    return max(w, h) <= SMALL_MAX or file.startswith("boss-")


def trim_and_fit(im, w, h):
    """Crop to alpha bbox, then scale to fill the w x h box (aspect preserved),
    centred on a transparent w x h canvas. Returns the new image + fill%."""
    bbox = im.getchannel("A").getbbox() if im.mode == "RGBA" else im.getbbox()
    if bbox:
        im = im.crop(bbox)
    bw, bh = im.size
    scale = min(w / bw, h / bh)
    nw, nh = max(1, round(bw * scale)), max(1, round(bh * scale))
    content = im.resize((nw, nh), Image.LANCZOS)
    canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    canvas.paste(content, ((w - nw) // 2, (h - nh) // 2))
    return canvas, nw / w * 100, nh / h * 100


def main():
    os.makedirs(OUT_TEXT, exist_ok=True)
    sprite_scale = read_sprite_scale()
    manifest = json.load(open(MANIFEST))

    trimmed = filled = flipped = skipped = 0
    rows = []
    for a in manifest["assets"]:
        if a.get("priority") == "keep-procedural":
            skipped += 1
            continue
        nw, nh = a["nativeSize"]
        scale = sprite_scale if is_gameplay(a["file"], nw, nh) else 1.0
        w, h = round(nw * scale), round(nh * scale)
        src = os.path.join(INCOMING, a["file"])
        dst = os.path.join(OUT_DIR, a["file"])
        if not os.path.exists(src):
            raise SystemExit(f"MISSING {a['file']}")
        im = Image.open(src).convert("RGBA")
        if a["file"] in FLIP:
            im = im.rotate(180)
            flipped += 1
        if max(nw, nh) <= SMALL_MAX:
            out, fw, fh = trim_and_fit(im, w, h)
            trimmed += 1
            rows.append(f"  trim+fit {a['file']:<20} -> {w}x{h}  fill {fw:.0f}/{fh:.0f}%")
        else:
            out = im.resize((w, h), Image.LANCZOS)
            tag = "x{:.2g}".format(scale) if scale != 1 else "native"
            rows.append(f"  resize   {a['file']:<20} -> {w}x{h}  ({tag})")
            filled += 1
        out.save(dst)

    for t in TEXT_FILES:
        src = os.path.join(INCOMING, "text", f"{t}.png")
        if not os.path.exists(src):
            raise SystemExit(f"MISSING text {t}")
        shutil.copyfile(src, os.path.join(OUT_TEXT, f"{t}.png"))

    print("\n".join(rows))
    print(f"\nSPRITE_SCALE={sprite_scale} (baked into gameplay sprites)")
    print(f"trim+fit={trimmed} (flipped={flipped})  resize={filled}  "
          f"skipped-procedural={skipped}  text={len(TEXT_FILES)}")


if __name__ == "__main__":
    main()
