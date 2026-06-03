#!/usr/bin/env python3
"""Preprocess delivered art (art/incoming) into runtime textures (public/textures).

Drives off art/assets.manifest.json (each asset's `file` + `nativeSize`).

- Small gameplay sprites (native max dimension <= SMALL_MAX, e.g. ships, bullets,
  enemies, pickups) are TRIMMED to their alpha bounding box and then scaled to
  FILL the native footprint (aspect preserved, centred on a native-size canvas).
  The delivered AI art carries empty transparent margins, so a plain resize made
  the visible sprite far smaller than its on-screen budget; trimming first makes
  it fill the footprint the way the old procedural art did.
- Large background pieces (bosses, planets, starship, nebula, asteroids, debris)
  fill their own frame already, so they get a plain high-quality resize.
- The 3 enemies that were drawn nose-UP are rotated 180 deg so they face down.
- `keep-procedural` assets (star tiles/dots, glow particle) are left to art.ts.
- Calligraphy theme text is copied at delivered resolution (downscaled in-engine).

Run from the project root:  python3 scripts/process-art.py
"""
import json
import os
import shutil
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INCOMING = os.path.join(ROOT, "art", "incoming")
OUT_DIR = os.path.join(ROOT, "public", "textures")
OUT_TEXT = os.path.join(OUT_DIR, "text")
MANIFEST = os.path.join(ROOT, "art", "assets.manifest.json")

# Sprites whose native max dimension is <= this are treated as small gameplay
# sprites (trim-to-content then fill the native box). Everything bigger is a
# background piece (plain resize). This cleanly splits the 13 sprites from the
# 13 backgrounds in the current manifest.
SMALL_MAX = 30

# Enemies generated nose-up that must face down in-game.
FLIP = {"enemy-grunt.png", "enemy-weaver.png", "enemy-diver.png"}

TEXT_FILES = ["title", "select", "ship-qingluan", "ship-bifang",
              "ship-qiongqi", "sortie", "back"]


def trim_and_fit(im, w, h):
    """Crop to alpha bbox, then scale to fill the native box (aspect preserved),
    centred on a transparent native-size canvas. Returns the new image + fill%."""
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
    manifest = json.load(open(MANIFEST))

    trimmed = filled = flipped = skipped = 0
    rows = []
    for a in manifest["assets"]:
        if a.get("priority") == "keep-procedural":
            skipped += 1
            continue
        w, h = a["nativeSize"]
        src = os.path.join(INCOMING, a["file"])
        dst = os.path.join(OUT_DIR, a["file"])
        if not os.path.exists(src):
            raise SystemExit(f"MISSING {a['file']}")
        im = Image.open(src).convert("RGBA")
        if a["file"] in FLIP:
            im = im.rotate(180)
            flipped += 1
        if max(w, h) <= SMALL_MAX:
            out, fw, fh = trim_and_fit(im, w, h)
            trimmed += 1
            rows.append(f"  trim+fit {a['file']:<20} -> {w}x{h}  fill {fw:.0f}/{fh:.0f}%")
        else:
            out = im.resize((w, h), Image.LANCZOS)
            filled += 1
        out.save(dst)

    for t in TEXT_FILES:
        src = os.path.join(INCOMING, "text", f"{t}.png")
        if not os.path.exists(src):
            raise SystemExit(f"MISSING text {t}")
        shutil.copyfile(src, os.path.join(OUT_TEXT, f"{t}.png"))

    print("\n".join(rows))
    print(f"\ntrim+fit={trimmed} (flipped={flipped})  resize={filled}  "
          f"skipped-procedural={skipped}  text={len(TEXT_FILES)}")


if __name__ == "__main__":
    main()
