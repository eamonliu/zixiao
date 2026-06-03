// One-off: resize delivered art (art/incoming) to native in-game sizes into
// public/textures, flipping the 3 nose-up enemies 180 deg. Drives off the
// manifest's nativeSize. Run with: node process-art.cjs
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const incoming = path.join(root, 'art/incoming');
const outDir = path.join(root, 'public/textures');
const outText = path.join(outDir, 'text');
const manifest = require('./art/assets.manifest.json');

fs.mkdirSync(outText, { recursive: true });

// Enemies that were generated nose-up but must face down in-game.
const FLIP = new Set(['enemy-grunt.png', 'enemy-weaver.png', 'enemy-diver.png']);

let resized = 0, flipped = 0, skipped = 0;
for (const a of manifest.assets) {
  if (a.priority === 'keep-procedural') { skipped++; continue; }
  const [w, h] = a.nativeSize;
  const src = path.join(incoming, a.file);
  const dst = path.join(outDir, a.file);
  if (!fs.existsSync(src)) { console.error('MISSING', a.file); process.exit(1); }
  const args = [];
  if (FLIP.has(a.file)) { args.push('-r', '180'); flipped++; }
  args.push('-z', String(h), String(w)); // sips wants height then width
  args.push(src, '--out', dst);
  execFileSync('sips', args, { stdio: 'ignore' });
  resized++;
}

// Calligraphy text: copy at delivered resolution (downscaled in-engine).
const textFiles = ['title', 'select', 'ship-qingluan', 'ship-bifang', 'ship-qiongqi', 'sortie', 'back'];
for (const t of textFiles) {
  const src = path.join(incoming, 'text', `${t}.png`);
  if (!fs.existsSync(src)) { console.error('MISSING text', t); process.exit(1); }
  fs.copyFileSync(src, path.join(outText, `${t}.png`));
}

console.log(`resized=${resized} (flipped=${flipped}) skipped-procedural=${skipped} text=${textFiles.length}`);
