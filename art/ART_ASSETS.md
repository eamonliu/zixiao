# 紫霄雷霆 · 美术资源索引（文生图生成指南）

> 用途：用文生图大模型重制一套美术资源。本文件是**所有美术资源的总索引**，
> 含资源名称、用途说明、当前尺寸、朝向/锚点、建议生成尺寸与**可直接复制的提示词**。
> 配套机器可读清单见 `art/assets.manifest.json`（替换流程用）。
>
> 现状：游戏目前**全部美术为运行时程序化生成**（`src/systems/art.ts`），无任何外部图片。
> 本次只产出索引，**不改动任何代码**。拿到新图后再做替换（替换约定见文末）。

---

## 0. 怎么用这份文件

1. 先读 **第 1 节「全局风格指南」**，把 `全局风格后缀` 和 `负面提示词` 固定下来——所有资源共用，保证整套风格统一。
2. 在 **第 3 节** 找到要做的资源，复制它的「提示词」并在末尾拼上「全局风格后缀」。
3. 中文主题文字（标题、机名等）走 **第 4 节** 的书法方案，**不要用文生图直接写汉字**。
4. 按 **第 1.4 节** 的尺寸/透明背景要求出图、抠图、裁切，按 **第 5 节** 命名交付。

> 强烈建议**先做一艘战机 + 一个敌机 + 一个 Boss** 做风格打样确认，再批量生成，避免整套返工。

---

## 1. 全局风格指南

### 1.1 总美术风格（最重要）
**整体目标：90 年代初期日式经典硬核科幻竖版弹幕射击（STG）像素美术。**

- **参考坐标**：Toaplan《究极タイガー/达人》《Fire Shark》、Seibu《雷电 Raiden》、Compile《Aleste/武者アレスタ》、Technosoft《Thunder Force》、早期 CAVE《首领蜂》。
  即 **16-bit 街机 / 世嘉MD / SFC 时代**的硬核 STG 质感。
- **画面气质**：军事工业风的科幻**战争机械**——金属舰体、铆钉、面板线与排气口；克制但有冲击力的**有限调色板**；厚重、剪影清晰、可读性高的**手绘像素精灵**；带网点（dithering）的明暗过渡；夸张厚重的爆炸。
  「硬核」体现在密集弹幕与**巨型机械 Boss（战舰/要塞）**的压迫感。
- **画风关键词**：`detailed 16-bit arcade pixel art / hand-pixeled sprite / classic vertical shoot-'em-up`。
  **不要**现代平滑矢量、3D 渲染、赛璐珞卡通、Q 版可爱、写实照片。

### ⚠️ 1.1.1 中国元素的边界（务必遵守）
- **机体、敌机、Boss、背景一律为纯科幻军用机械**，**不得**出现神兽、神话生物、龙凤、祥云、东方纹样等元素。
  战机的中文名（青鸾/毕方/穷奇）**仅是命名标签**，不在造型上体现；造型按 90s STG 战机来做（轻型截击机 / 中型炮艇 / 重型突击机）。
- **中国元素只出现在「主题文字」**：进入界面标题、机体选择界面的中文，用**张扬的中文书法**呈现（详见第 4 节）。
- 因此所有精灵的提示词都会显式把 `mythical creature / fantasy / dragon / Chinese pattern / calligraphy` 放进负面词。

### 1.2 视角与朝向
- **视角**：俯视（top-down / 鸟瞰正交），竖版飞行射击。
- **朝向**：
  - 玩家战机：**机头朝上**（指向画面顶部）。
  - 敌机 / Boss：**机头朝下**（指向画面底部，朝向玩家）。
- 提示词朝向修正：玩家机加 `nose pointing up`；敌机/Boss 加 `nose pointing down (toward viewer)`。

### 1.3 配色板（沿用游戏内色，保证与 UI/弹幕协调；每个精灵用其中一组为主的有限调色）
| 用途 | 名称 | HEX |
|---|---|---|
| 背景深空 | bg0 / bg1 / bg2 | `#05060f` / `#0a1330` / `#132257` |
| 星点 | star | `#9fe9ff` |
| 青鸾 机体/暗部/座舱/尾焰 | player | `#8fe7ff` / `#2f7fb8` / `#fff3b0` / `#ff7b3d` |
| 毕方 机体/暗部 | ship2 | `#ff6f5c` / `#9c2f2a` |
| 穷奇 机体/暗部 | ship3 | `#ffd24d` / `#a6791a` |
| 敌-红(grunt) | enemyA | `#ff5d73` / `#8c2740` |
| 敌-黄(weaver/diver) | enemyB | `#ffd166` / `#9c6f1f` |
| 敌-紫(turret/carrier) | enemyC | `#b892ff` / `#5a3aa6` |
| 敌弹 普通/芯/瞄准 | enemyShot | `#ff8bd0` / `#ffe3f4` / `#ff5252` |
| Boss 机体/暗部/核心 | boss | `#c0c8ff` / `#47508f` / `#ff4d6d` |
| 强化(P) / 炸弹 / 擦弹 / 爆炸 | pickups/fx | `#5dff9b` / `#ffe14d` / `#fff7a8` / `#ffd07a` |
| HUD 青/粉 | hud | `#9fe9ff` / `#ff8bd0` |

### 1.4 全局提示词（复制即用）

**全局风格后缀**（拼接到每条精灵提示词末尾）：
```
top-down view, single subject centered with even padding, isolated on a transparent background, early-1990s Japanese arcade vertical shoot-'em-up pixel art, detailed 16-bit hand-pixeled sprite, gritty military-industrial sci-fi war machine, metallic hull with rivets and panel lines, punchy limited palette, dithered shading, sharp readable silhouette, dramatic neon energy accents, game sprite, no text, no logo, no watermark
```

**负面提示词**（统一使用；显式排除东方/神话元素，保持纯科幻机械）：
```
text, letters, numbers, watermark, signature, logo, UI, HUD, frame, border, background scenery, ground, horizon, baked drop shadow, photorealistic, 3D render, smooth vector, cel-shaded cartoon, chibi, cute, kawaii, anime character, fantasy, medieval, dragon, phoenix, mythical creature, beast, feathers, ornament, calligraphy, Chinese pattern, blurry, low contrast, jpeg artifacts, multiple objects, duplicated subject, cropped, out of frame, perspective view, 3/4 view, isometric
```

### 1.5 出图、尺寸与透明背景规范
- **透明背景**：交付必须是 **PNG-32（带 Alpha）**。模型不支持透明就在**纯绿幕 `#00FF00`** 上出图再抠像。主体下方不要烘焙投影/地台。
- **像素质感**：本作是像素 STG。可在较大画布生成，再**缩放并对齐到像素网格**（必要时手动清边/限色），保留硬边像素感，避免发虚。
- **构图**：主体居中、留边距（约 10–15%），不要出血裁切。保持各资源标注的**长宽比**与朝向。
- **生成分辨率**：见各资源「生成画布」；出图后裁紧并缩放到「建议交付分辨率」（≈当前尺寸 2–4 倍，细节更足）。
- 「当前尺寸」= 现在游戏里的像素占位（很小，供你参考长宽比与相对大小）。替换时代码按屏上占位缩放，画面布局不变。
- 渲染备注（供后续替换，本次不改）：游戏当前 `pixelArt:true`（最近邻）。换成新图后我会按交付分辨率调整缩放/渲染项，保持像素清晰。

---

## 2. 资源总表（速览）

共 **31** 个纹理 + **一组中文书法主题文字**（第 4 节）。`优先级` = 建议替换价值。

| # | key | 资源 | 类别 | 当前px | 朝向 | 优先级 |
|--:|---|---|---|---|---|---|
| 1 | `tex-player` | 青鸾（玩家·蓝/轻） | 玩家机 | 22×28 | 上 | ★★★ |
| 2 | `tex-ship-bifang` | 毕方（玩家·红/中） | 玩家机 | 22×22 | 上 | ★★★ |
| 3 | `tex-ship-qiongqi` | 穷奇（玩家·黄/重） | 玩家机 | 26×20 | 上 | ★★★ |
| 4 | `tex-player-shot` | 玩家子弹 | 子弹 | 6×10 | 上 | ★★ |
| 5 | `tex-enemy-grunt` | 杂兵（红） | 敌机 | 26×20 | 下 | ★★★ |
| 6 | `tex-enemy-weaver` | 游走机（黄） | 敌机 | 22×22 | 下 | ★★★ |
| 7 | `tex-enemy-turret` | 炮台/母舰（紫） | 敌机 | 18×18 | 全向 | ★★★ |
| 8 | `tex-enemy-diver` | 俯冲机（黄） | 敌机 | 18×14 | 下 | ★★ |
| 9 | `tex-enemy-shot` | 敌弹·圆 | 子弹 | 6×6 | 无 | ★★ |
| 10 | `tex-enemy-shot-aimed` | 敌弹·瞄准针 | 子弹 | 6×10 | 下 | ★★ |
| 11 | `tex-enemy-shot-big` | 敌弹·大球 | 子弹 | 10×10 | 无 | ★★ |
| 12 | `tex-powerup` | 强化道具(P) | 拾取 | 15×15 | 无 | ★★ |
| 13 | `tex-bomb-pickup` | 炸弹道具 | 拾取 | 15×15 | 无 | ★★ |
| 14 | `tex-boss-1` | CRIMSON WARDEN（赤） | Boss | 168×132 | 下 | ★★★ |
| 15 | `tex-boss-2` | AZURE LEVIATHAN（蓝） | Boss | 168×132 | 下 | ★★★ |
| 16 | `tex-boss-3` | VIOLET SOVEREIGN（紫） | Boss | 168×132 | 下 | ★★★ |
| 17 | `tex-planet-blue` | 蓝色星球（一关远景） | 背景·远 | 420×420 | 无 | ★★★ |
| 18 | `tex-planet-violet` | 紫色带环气态巨星（三关远景） | 背景·远 | 672×672 | 无 | ★★★ |
| 19 | `tex-starship` | 母舰/空间站（二关远景） | 背景·远 | 280×520 | 下 | ★★★ |
| 20 | `tex-nebula` | 星云（二关中景，叠加发光） | 背景·中 | 256×256 | 无 | ★★ |
| 21 | `tex-asteroid-1` | 陨石 A（一关中景） | 背景·中 | 64×64 | 无 | ★★ |
| 22 | `tex-asteroid-2` | 陨石 B | 背景·中 | 80×80 | 无 | ★★ |
| 23 | `tex-asteroid-3` | 陨石 C | 背景·中 | 52×52 | 无 | ★★ |
| 24 | `tex-debris-1` | 飞船残骸 A（三关中景） | 背景·中 | 72×72 | 无 | ★★ |
| 25 | `tex-debris-2` | 飞船残骸 B | 背景·中 | 56×56 | 无 | ★★ |
| 26 | `tex-debris-3` | 飞船残骸 C | 背景·中 | 64×64 | 无 | ★★ |
| 27 | `tex-star-tile-far` | 远层星空（无缝平铺） | 背景·星 | 480×720 | 无 | ☆（建议保留程序化） |
| 28 | `tex-star-tile-near` | 近层星空（无缝平铺） | 背景·星 | 480×720 | 无 | ☆（建议保留程序化） |
| 29 | `tex-star-small` | 小星点 | 背景·星 | 2×2 | 无 | ☆（保留程序化） |
| 30 | `tex-star-big` | 大星点 | 背景·星 | 3×3 | 无 | ☆（保留程序化） |
| 31 | `tex-particle` | 通用辉光粒子（爆炸/尾焰，叠加） | FX | 24×24 | 无 | ☆（建议保留程序化） |

---

## 3. 逐资源说明 + 提示词

> 每条「提示词」请在末尾拼接 **1.4 全局风格后缀**，并配合统一**负面提示词**。
> 颜色尽量贴近 1.3 配色板，单个精灵走有限调色。

### A. 玩家战机（机头朝上 / 纯科幻军用机，无任何神兽元素）

#### 1. `tex-player` —— 青鸾（蓝 · 轻型截击机）
- 说明：默认机，蓝色轻型，敏捷、连射快、弹轻甲薄。名字只是命名标签。
- 当前 22×28（宽:高≈0.79，竖长）｜锚点居中｜生成画布 1024×1024｜建议交付 88×112（PNG-32）。
```
A small fast interceptor starfighter, classic early-90s arcade STG pixel art. Top-down, nose pointing up. Compact angular jet/space-fighter hull, swept wings, cyan/ice-blue metal plating (#8fe7ff) with steel-blue shadows (#2f7fb8), a small amber canopy (#fff3b0), twin glowing cyan thrusters with orange flame (#ff7b3d). Lightweight, agile, Raiden/Aleste-style military craft.
```

#### 2. `tex-ship-bifang` —— 毕方（红 · 中型炮艇）
- 说明：均衡型中型机，攻守平衡、双尾翼。
- 当前 22×22（≈1:1）｜居中｜生成 1024×1024｜建议交付 88×88。
```
A medium all-round gunship starfighter, early-90s arcade STG pixel art. Top-down, nose up. Sturdy broad hull with twin tail fins and side weapon hardpoints, crimson-red plating (#ff6f5c) with dark maroon panels (#9c2f2a), amber canopy, orange engine exhaust. Balanced military space-fighter, Toaplan/Raiden vibe.
```

#### 3. `tex-ship-qiongqi` —— 穷奇（黄 · 重型突击机）
- 说明：重型机，装甲厚、火力猛、机动慢。
- 当前 26×20（宽:高≈1.3，扁宽）｜居中｜生成 1024×1024｜建议交付 104×80。
```
A heavy armored assault craft, early-90s arcade STG pixel art. Top-down, nose up. Wide bulky hull, thick armor plating, multiple gun pods and missile racks, gold/amber plating (#ffd24d) with bronze shadows (#a6791a), dual heavy engines with gold glow. Tanky military gunship, MUSHA / Battle-Garegga heavy-bomber vibe.
```

### B. 敌机（机头朝下，朝向玩家）

#### 5. `tex-enemy-grunt` —— 杂兵（红）
- 当前 26×20（≈1.3 扁宽）｜居中｜生成 1024×1024｜建议交付 104×80。
```
A small mass-produced enemy fighter drone, early-90s arcade STG pixel art. Top-down, nose pointing down toward viewer. Angular military hull, hostile red plating (#ff5d73) with dark crimson panels (#8c2740), a single sensor eye, short swept wings. Cheap expendable popcorn enemy.
```

#### 6. `tex-enemy-weaver` —— 游走机（黄）
- 当前 22×22（≈1:1）｜居中｜生成 1024×1024｜建议交付 88×88。
```
A sleek fast enemy interceptor, 16-bit arcade STG pixel art. Top-down, nose down. Slim dart hull with forward-swept wings, golden-yellow plating (#ffd166) with amber panels (#9c6f1f), a glowing white centerline. Agile, weaving.
```

#### 7. `tex-enemy-turret` —— 炮台 / 母舰（紫）
- 说明：紫色固定炮台（也复用为「母舰 carrier」）。四向对称、无明确朝向。
- 当前 18×18（1:1）｜居中｜生成 1024×1024｜建议交付 72×72。
```
A stationary armored gun turret / weapons emplacement, 16-bit arcade STG pixel art, top-down, radially symmetric (no clear front). Riveted violet-purple dome (#b892ff) with deep indigo shadows (#5a3aa6), four glowing white emitter ports around a central barrel. Fortified, mechanical.
```

#### 8. `tex-enemy-diver` —— 俯冲机（黄）
- 当前 18×14（≈1.29 扁宽）｜居中｜生成 1024×1024｜建议交付 72×56。
```
A fast arrow-shaped kamikaze interceptor, 16-bit arcade STG pixel art. Top-down, nose pointing sharply down. Lean pointed hull, yellow (#ffd166)/red (#ff5d73) two-tone plating, bright nose tip, stubby rear fins. High-speed diver.
```

### C. Boss（巨型机械战舰/要塞，机头朝下；中央底部有发光「核心」弱点）

> 三个 Boss 共用 168×132（宽:高≈1.27）占位。中央底部务必保留一颗明亮发光核心（弱点）。
> 生成画布 2048×1536（≈4:3）｜建议交付 504×396（≈3×）。
> 英文呼号（CRIMSON WARDEN 等）是军事代号，**不出现在贴图里**，仅供你理解气质。

#### 14. `tex-boss-1` —— CRIMSON WARDEN（一关 · ORBITAL APPROACH）
```
A massive mechanical battleship boss, early-90s arcade STG pixel art. Top-down, wide armored hull pointing down, bilaterally symmetric. Riveted deep-red armor (#ff5d73) with dark crimson plating (#8c2740), two large shoulder weapon turrets with glowing red orbs, heavy panel lines and exhaust vents, a central prow cannon, and a bright glowing red-pink core weakpoint (#ff4d6d) at bottom center with a white-hot middle. Menacing Toaplan/Raiden-style war machine.
```

#### 15. `tex-boss-2` —— AZURE LEVIATHAN（二关 · ION STORM）
```
A vast mechanical capital-ship boss, early-90s arcade STG pixel art. Top-down, broad armored hull pointing down, symmetric. Steel-blue riveted armor (#c0c8ff) with navy plating (#47508f), ion-cannon arrays and antenna masts, shoulder turrets with glowing blue orbs, a vertical spine seam, and a bright glowing red-pink core weakpoint (#ff4d6d) at bottom center. Colossal military dreadnought.
```

#### 16. `tex-boss-3` —— VIOLET SOVEREIGN（三关 · SOVEREIGN GATE）
```
An enormous mechanical fortress-ship final boss, early-90s arcade STG pixel art. Top-down, heavy layered hull pointing down, symmetric. Violet-purple riveted armor (#b892ff) with deep indigo plating (#5a3aa6), multiple gun turrets and a massive main cannon prow, twin shoulder pods with glowing purple orbs, and a large bright glowing red-pink core weakpoint (#ff4d6d) at bottom center with a white-hot core. Imposing war-fortress (mechanical only, no fantasy ornament).
```

### D. 子弹

#### 4. `tex-player-shot` —— 玩家子弹（向上）
- 当前 6×10（细长竖）｜居中｜生成 512×768｜建议交付 24×40。游戏会按机体染色（青鸾青白/毕方橙/穷奇金），故主色出**青白**、保持可染色。
```
A vertical energy bolt / vulcan tracer round pointing up, 16-bit STG pixel art. Bright cyan-white core (#ffffff) with a pale-cyan glow (#bff4ff), elongated capsule, sharp bright tip, hard-edged pixel glow. Clean, readable, fast.
```

#### 9. `tex-enemy-shot` —— 敌弹·圆
- 当前 6×6｜居中｜生成 512×512｜建议交付 24×24。
```
A small round enemy energy orb projectile, 16-bit STG pixel art. Hot pink (#ff8bd0) with a bright pale-pink core (#ffe3f4), crisp circular pixel bullet with a clean rim. Highly readable on a dark background.
```

#### 10. `tex-enemy-shot-aimed` —— 敌弹·瞄准针（向下）
- 当前 6×10｜居中｜生成 512×768｜建议交付 24×40。
```
A sharp aimed needle/dart projectile pointing down, 16-bit STG pixel art. Vivid red shaft (#ff5252) with a white-hot core (#ffe3f4), elongated diamond/needle, fast and menacing. High-contrast, readable.
```

#### 11. `tex-enemy-shot-big` —— 敌弹·大球
- 当前 10×10｜居中｜生成 512×512｜建议交付 40×40。
```
A large heavy enemy plasma orb projectile, 16-bit STG pixel art. Pink energy sphere (#ff8bd0) with a layered bright pale-pink core (#ffe3f4), hard pixel rim and slight inner swirl. Dangerous, eye-catching.
```

### E. 拾取道具（发光晶体/图标，街机风）

#### 12. `tex-powerup` —— 强化(P，绿)
- 当前 15×15｜居中｜生成 512×512｜建议交付 60×60。
```
A glowing power-up pickup item, 16-bit arcade STG pixel art. A rounded emerald-green crystal capsule (#5dff9b) with a bright white "P" power emblem, dark green inner facets (#0a2a18), crisp pixel highlights and halo. Classic STG item icon.
```

#### 13. `tex-bomb-pickup` —— 炸弹(黄)
- 当前 15×15｜居中｜生成 512×512｜建议交付 60×60。
```
A glowing bomb pickup item, 16-bit arcade STG pixel art. A rounded golden-yellow crystal capsule (#ffe14d) with a bright white bomb/burst emblem, dark amber inner facets (#3a2a05), crisp pixel highlights and halo. Classic STG item icon.
```

### F. 背景 · 远景（每关一件，巨大、缓慢漂移；16-bit 像素星空背景）

#### 17. `tex-planet-blue` —— 蓝色星球（一关）
- 当前 420×420（圆盘约占 70%，四周留大气辉光）｜居中｜生成 2048×2048｜建议交付 840×840。
```
A giant blue planet seen from space, 16-bit arcade STG pixel-art backdrop, full disc centered with empty transparent margin. Deep ocean-blue surface (#2c4a7a), bright lit limb upper-left (#9fc6ff), dark night side fading to black lower-right, dithered cratered terrain, a soft glowing blue atmosphere halo (#6fb4ff). Classic STG stage planet.
```

#### 18. `tex-planet-violet` —— 紫色带环气态巨星（三关）
- 当前 672×672（光环外扩，留白大）｜居中｜生成 2048×2048｜建议交付 1024×1024。
```
A giant ringed violet gas giant seen from space, 16-bit arcade STG pixel-art backdrop, full disc centered with wide transparent margin for its ring. Banded purple cloud layers (#4a2c6a) with dithered shading, bright lit limb upper-left (#d8a0ff), dark side lower-right, a tilted Saturn-like pale-violet ring (#c9a8ff) crossing front and behind, soft purple atmosphere glow (#b878ff). Majestic stage backdrop.
```

#### 19. `tex-starship` —— 母舰 / 空间站（二关）
- 说明：远处缓缓下压的巨型主力舰/空间站，纵向长条，舰首朝上、引擎朝下（朝向玩家），舷窗灯光点点。
- 当前 280×520（宽:高≈0.54，竖长条）｜居中｜生成 1152×2048｜建议交付 560×1040。
```
A distant massive capital ship / battle carrier, 16-bit arcade STG pixel art, long vertical silhouette seen top-down. Prow pointing up, three glowing engine nozzles at the bottom facing the viewer. Pale steel-blue riveted hull (#c0c8ff) with dark plating (#47508f), stacked hull sections, panel seams and antenna masts, dozens of tiny warm window lights (#bfe6ff), bright cyan engine glow (#6fd0ff). Imposing industrial warship.
```

### G. 背景 · 中景（每关 1–3 件，成群漂移/旋转）

#### 20. `tex-nebula` —— 星云（二关，加色叠加 ADD）
- 说明：柔和蓝紫星云团，**加色叠加**——主体大面积半透明、暗底上发光，点缀星点。
- 当前 256×256｜居中｜生成 1024×1024（可平铺更佳）｜建议交付 512×512。
```
A soft glowing space nebula cloud for additive blending (bright on black, mostly transparent), 16-bit STG pixel-art style. Blended blue (#3a78ff) and violet (#9f5dff) gaseous puffs with subtle dithering, faint white star flecks, no hard edges. Ethereal stage haze.
```

#### 21–23. `tex-asteroid-1/2/3` —— 陨石（一关）
- 说明：灰褐色不规则岩石，俯视，带陨石坑明暗。三件各异（大中小）。
- 尺寸：A 64×64 / B 80×80 / C 52×52｜居中｜生成 768×768｜建议交付各约 2–3×（A 192 / B 240 / C 156）。
```
An irregular rocky asteroid seen from above, 16-bit arcade STG pixel art, lumpy boulder. Grey-brown stone (#6b5d52) with dark crevices (#2a2018) and light highlights (#b8a890), dithered impact craters, a bright lit edge and a shadowed side. Rugged, natural. (Generate 3 distinct variants: large / largest / small.)
```

#### 24–26. `tex-debris-1/2/3` —— 飞船残骸（三关）
- 说明：棱角分明的金属残骸碎块，带面板线/焊缝/烧灼，俯视。三件各异。
- 尺寸：A 72×72 / B 56×56 / C 64×64｜居中｜生成 768×768｜建议交付各约 2–3×。
```
A jagged chunk of broken warship wreckage / metal debris seen from above, 16-bit arcade STG pixel art. Twisted angular hull plating in cold steel-grey (#6a6f7a) with dark recesses (#202430) and bright metal highlights (#c0d0e0), rivets, panel lines, scorch marks and torn edges. Industrial, damaged. (Generate 3 variants; one with burnt reddish plating, one teal-grey.)
```

### H. 背景 · 星空与粒子（建议保留程序化，列出供参考）

> 更适合代码程序化生成（无缝无限滚动 / 极小尺寸 / 加色辉光），**不建议**文生图替换；如替换务必**四向无缝平铺**。

- `tex-star-tile-far` / `tex-star-tile-near`（各 480×720）：两层视差星空，需无缝。`seamless tileable starfield, scattered tiny white and cyan (#9fe9ff) stars, varied brightness, transparent background`。
- `tex-star-small`(2×2) / `tex-star-big`(3×3)：单个星点，保留程序化。
- `tex-particle`(24×24)：通用柔和辐射状辉光（爆炸/尾焰/弹芯，加色）。如需出图：`soft radial glow blob, white-hot center fading to warm orange (#ffd07a) then transparent, additive, circular`。

---

## 4. 中文主题文字（书法 · 唯一的中国元素）★必做

中国元素**只**在主题文字上出现，且要**张扬的中文书法**——浓墨重笔的**狂草/行草**，飞白、起收带锋、气势凌厉，与 90s STG 的金属/霓虹质感相衬（可加细金边或青/紫辉光描边）。

> ⚠️ **不要用文生图模型直接写汉字**（极易写错/变形）。推荐：①设计软件里用书法字体排版后导出；②手写/数位板书写后矢量化；③请书法作者题字后扫描。统一导出**透明 PNG**。
> 推荐字体方向：方正狂草 / 字魂狂草 / 演示悠然小楷之外的**狂草·行草类**；或真人题字最佳。

| 资源 | 文字 | 用途 | 建议尺寸(px) | 备注 |
|---|---|---|---|---|
| `text-title` | **紫霄雷霆** | 进入/标题界面主标题 | 1200×600（透明） | 横排或斜冲构图，浓墨狂草 + 飞白，主色墨黑/描金，带轻微紫电辉光 |
| `text-ship-qingluan` | **青鸾** | 选机界面·机名 | 360×360 | 行草，单色（可与机体青色呼应的描边） |
| `text-ship-bifang` | **毕方** | 选机界面·机名 | 360×360 | 同上，红色描边呼应 |
| `text-ship-qiongqi` | **穷奇** | 选机界面·机名 | 360×360 | 同上，金色描边呼应 |
| `text-select`（可选） | **选择战机** | 选机界面标题 | 700×220 | 行草，弱于主标题 |
| `text-sortie`（可选） | **出击** / **返回** | 选机界面按钮 | 各 280×160 | 可保留现有字体，或同风格书法 |

> 当前这些文字在游戏里是**系统等宽字体即时渲染**（`MenuScene`）。替换为书法图后需在菜单里把对应文本换成图片——这是个小改动，等你给图我来接。

---

## 5. 交付与替换约定

### 5.1 目录与命名
```
art/incoming/        ← 精灵/背景 PNG（透明）
art/incoming/text/   ← 中文书法 PNG（透明）
```
精灵文件名 = **去掉 `tex-` 前缀的 key**：`tex-player → player.png`、`tex-boss-1 → boss-1.png`、`tex-planet-violet → planet-violet.png`（多变体如 `asteroid-1/2/3.png`）。
书法文件名 = 上表 key：`text-title.png`、`text-ship-qingluan.png` 等。
（与 `assets.manifest.json` 中各条 `file` 字段一致。）

### 5.2 交付清单（建议附带）
每个文件注明：实际像素尺寸、是否含透明、是否加色叠加素材（nebula/particle）。其余元信息我从 `assets.manifest.json` 读取。

### 5.3 替换工作（拿到图后我来做，本次不动代码）
1. `art/incoming/*` 作为真实资源在 `BootScene` 预加载，替代 `src/systems/art.ts` 对应纹理的程序化生成。
2. 逐个把 `generateAllTextures` 的 `paintGrid/makeXxx` 换成 `this.load.image(KEY, ...)`，**保持 `TEX.*` key 不变** → 实体/场景逻辑零改动。
3. 按交付分辨率与屏上占位统一设置显示缩放，确保布局、碰撞半径、弹幕节奏不变。
4. 书法文字：把 `MenuScene` 里对应系统字体文本替换为图片。
5. 逐关回归测试（含过关切换、画面居中），确认无回归。

> 支持**分批**替换（如先换三战机 + 三 Boss + 标题书法）。我可做成「有新图就用图、没有就回退程序化」的渐进式替换。

---

## 6. 可选 / 扩展资源

| 名称 | 用途 | 建议尺寸 | 要点 |
|---|---|---|---|
| 主菜单 Key Art | 菜单背景大图 | 1280×1920 竖 | 90s 街机宣传画风格的像素插画：机群冲入弹幕与巨型 Boss，硬核科幻战争感（无东方元素） |
| App 图标 / favicon | 浏览器标签/桌面 | 512×512 | 机体剪影 + 霓虹，简洁高辨识（纯科幻） |

---

*本索引依据 `src/systems/art.ts` 当前实现整理；尺寸为运行时实际生成像素。配套机器可读清单：`art/assets.manifest.json`。*
