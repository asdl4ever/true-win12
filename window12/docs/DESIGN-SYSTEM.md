# Window 12 · 设计系统规范

> Spatial 奶黄液态玻璃 · v1.0
> 适用范围：`src/` 下全部界面。所有视觉决策以本文档为准；组件内出现本文档未定义的魔法值时，视为缺陷。

---

## 0. 设计立场

**一句话**：奶黄色的暖光空间里，漂浮着一层会呼吸的液态玻璃；玻璃能捏、能弹、能把光聚在指针经过的地方。

五条硬性原则：

1. **奶黄是空间，不是装饰。** 奶黄贯穿"环境 → 玻璃 → 文字"三层：壁纸是奶黄、玻璃是奶白（带黄 tint）、文字是暖棕墨。任何一层的纯白/纯黑/冷灰都是破口。
2. **材质只有四档，全部从 `--blur` 派生。** 组件不许自己写 `blur(28px)` 这类定值。设置里的"背景模糊"滑块是全站唯一开关。
3. **形状全部从 `--radius` 派生。** 组件不许写死 `12px` 圆角。滑块一动，全站同步。
4. **玻璃靠 `inset` 阴影塑形，不靠伪元素。** 厚度、边缘高光、内雾一律用多层 `box-shadow: inset` 表达——它们天然绘于内容之下，不产生层叠与 `z-index` 问题，也少一层合成开销。镜面反光烘焙进元素自身的 `background-image`。
5. **动效只有四条曲线、五档时长。** 果冻感来自 `--spring-jelly` 的过冲，不来自任意 `cubic-bezier`。动画只碰 `transform` 与 `opacity`。

---

## 1. 色彩系统

### 1.1 Primitive · 奶黄色阶

以中国传统色「奶黄」`#F9E4A5` 为主色，向两端展开。

| 令牌 | 值 | 用途 |
| --- | --- | --- |
| `--cream-000` | `#FFFDF6` | 珍珠白，玻璃最亮处、文字反白 |
| `--cream-050` | `#FDF7E4` | 环境高光，壁纸起点 |
| `--cream-100` | `#F9E4A5` | **奶黄主色**，壁纸中段 |
| `--cream-200` | `#F2D68C` | 环境中深 |
| `--cream-300` | `#E8C468` | 环境深处 |
| `--cream-400` | `#D8A93C` | 暖金，描边与强调光 |

### 1.2 Primitive · 墨色阶梯（暖棕）

文字与线条统一用暖棕，禁止纯黑（`#000`、`#111`）与冷灰。

| 令牌 | 值 | 用途 |
| --- | --- | --- |
| `--ink-900` | `#3D2B0E` | 正文、标题 |
| `--ink-700` | `#5C4519` | 次级标题 |
| `--ink-500` | `rgba(74,56,20,.62)` | 次级文字、占位符 |
| `--ink-400` | `rgba(74,56,20,.42)` | 弱化文字、禁用态 |
| `--ink-300` | `rgba(74,56,20,.26)` | 分隔线 |
| `--ink-200` | `rgba(74,56,20,.16)` | 描边、轨道 |
| `--ink-100` | `rgba(74,56,20,.10)` | 内嵌底、空槽 |
| `--ink-050` | `rgba(74,56,20,.06)` | 极淡底、斑马纹 |

> **迁移要点**：旧代码里散落的 `rgba(74,56,20,0.07/0.08/0.12/0.14/0.18/0.26)` 六档全部收敛到上表。

### 1.3 Primitive · 奶白玻璃

**关键变化**：玻璃基色从纯白改为奶白，让奶黄透过玻璃。

| 令牌 | 值 | 对应材质档 |
| --- | --- | --- |
| `--glass-thin` | `rgba(255,252,242,.32)` | M1 薄雾 |
| `--glass-base` | `rgba(255,250,236,.55)` | M2 标准玻璃 |
| `--glass-thick` | `rgba(255,248,228,.74)` | M3 厚玻璃 |
| `--glass-solid` | `rgba(255,252,244,.92)` | M4 实心 |
| `--glass-edge` | `rgba(255,255,255,.72)` | M1/M2 边框 |
| `--glass-edge-strong` | `rgba(255,255,255,.88)` | M3/M4 边框 |

### 1.4 Semantic · 暖调强调色（5 套，可切换）

替换原 visionOS 系统五色。全部为暖色系，与奶黄环境同源。

| 名称 | `--accent` | `--accent-deep`（按下/描边） | `--accent-contrast`（其上文字） |
| --- | --- | --- | --- |
| **蜂蜜 Honey**（默认） | `#D99B1E` | `#B87F12` | `#3D2B0E` |
| 蜜桃 Peach | `#E4703C` | `#C55626` | `#3D2B0E` |
| 莓果 Berry | `#D24A6E` | `#B03356` | `#FFFFFF` |
| 抹茶 Matcha | `#5F9E58` | `#487E42` | `#FFFFFF` |
| 紫薯 Ube | `#8B6AD0` | `#7251B8` | `#FFFFFF` |

**对比度规则**：
- 强调色**极少作为纯色大面积背景**——主要用于淡底（`color-mix(in srgb, var(--accent) 14%, var(--glass-base))`）、描边、指示点、聚焦环、光晕。
- 需要纯色底时（如填充按钮），文字色一律取 `--accent-contrast`，由 store 随强调色一起下发。
- 淡底上的文字一律用 `--text`（暖棕），不用 `--accent-contrast`。

### 1.5 Semantic · 语义色与遮罩

| 令牌 | 值 | 替代 |
| --- | --- | --- |
| `--danger` | `#D9564A` | 旧的 `#ff3b30`（3 处重复） |
| `--on-danger` | `#FFFFFF` | — |
| `--success` | `#4E9A6A` | 旧 `--sys-green` |
| `--warning` | `#D99B1E` | 同蜂蜜 |
| `--shade` | `133,96,26` | 暖棕阴影基色（保留） |
| `--scrim-rgb` | `74,55,16` | 压暗遮罩（保留） |
| `--scrim` | `rgba(74,55,16,.28)` | 浮层压暗 |

### 1.6 Semantic · 阴影

保持三层暖棕扩散，不新增档位。

| 令牌 | 值 |
| --- | --- |
| `--shadow-1` | `0 4px 14px -4px rgba(133,96,26,.16)` |
| `--shadow-2` | `0 16px 40px -12px rgba(133,96,26,.26), 0 4px 14px -6px rgba(133,96,26,.16)` |
| `--shadow-3` | `0 32px 80px -20px rgba(133,96,26,.34), 0 10px 28px -10px rgba(133,96,26,.20)` |

**禁止**：`rgba(0,0,0,.1)` 一类的纯黑阴影（当前存在于 `DesktopIcons.vue`、`WhackAMoleGame.vue`）。

---

## 2. 字体系统

### 2.1 字体家族

| 角色 | 令牌 | 字体栈 |
| --- | --- | --- |
| 标题/数字 | `--display-font` | `'Fredoka', 'PingFang SC', 'Microsoft YaHei UI', system-ui, sans-serif` |
| 正文/界面 | `--body-font` | `'Nunito', 'PingFang SC', 'Microsoft YaHei UI', system-ui, sans-serif` |

- **Fredoka**：圆润终端、几何骨架，字重 400–700，负责标题、数字、按钮。
- **Nunito**：圆润人文无衬线，字重 400–700，负责正文与控件文字。
- 中文回落系统的 PingFang SC（macOS/iOS）与 Microsoft YaHei UI（Windows）。**已知取舍**：中文本身不圆，属已接受的范围外项。
- 若后续要中文也圆：追加 `阿里妈妈方圆体`（免费商用）子集化自托管，只需替换 `--display-font`/`--body-font` 的中文段，不动其它任何代码。

### 2.2 字阶

八档，替换当前 10.5–21px 的 11 档乱值。

| 令牌 | 值 | 行高 | 字重 | 用途 |
| --- | --- | --- | --- | --- |
| `--fs-hero` | `clamp(46px, 8vw, 84px)` | 1 | 700 | 开机/关机大字 |
| `--fs-display` | `21px` | 1.25 | 700 | 任务视图标题、面板主标题 |
| `--fs-title` | `15px` | 1.35 | 700 | 窗口标题、区块标题 |
| `--fs-subtitle` | `13.5px` | 1.45 | 700 | 系统托盘时间、卡片标题 |
| `--fs-body` | `13px` | 1.55 | 400/500 | 正文默认 |
| `--fs-label` | `12.5px` | 1.5 | 500 | 控件标签、次要说明 |
| `--fs-caption` | `11.5px` | 1.5 | 500 | 元信息、计数 |
| `--fs-micro` | `10.5px` | 1.45 | 600 | 徽标、极小标注 |

字重令牌：`--fw-regular:400` `--fw-medium:500` `--fw-semi:600` `--fw-bold:700`。

> Fredoka 与 Nunito 的可用字重上限为 700。**禁止使用 800/900** —— 浏览器会合成加粗，笔画发糊。需要更强的视觉重量时改用字号与颜色对比。

**禁止**：在组件里写 `font-size: 12.5px` 这类裸值；禁止内联 `:style` 设字号（当前 `Game2048.vue` 有）。

### 2.3 排版细则

- 中文正文 `letter-spacing: 0.01em`；拉丁标题 `letter-spacing: -0.01em`；全大写场景不存在，**禁止 `text-transform: uppercase`**。
- 中英混排段落行高不低于 `1.55`。
- 数字使用 `font-variant-numeric: tabular-nums`（时钟、进度、分数）。

---

## 3. 材质系统（液态玻璃）

### 3.1 四档材质

| 档 | 类名 | 用途 | 背景 | backdrop-filter | 边框 | 圆角 | 阴影 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **M1** 薄雾 | `.glass-thin` | 图标底、chip、选中底、内嵌块 | `--glass-thin` | `blur(calc(var(--blur) * .35)) saturate(150%)` | `--glass-edge` | `--r-inner` | `--shadow-1` |
| **M2** 玻璃 | `.glass` | 窗口、卡片、搜索框 | `--glass-base` | `blur(var(--blur)) saturate(180%)` | `--glass-edge` | `--r-panel` | `--shadow-2` |
| **M3** 厚玻璃 | `.glass-dense` | 任务栏、Dock、开始菜单、全屏面板 | `--glass-thick` | `blur(calc(var(--blur) * 1.25)) saturate(185%)` | `--glass-edge-strong` | `--r-screen` | `--shadow-3` |
| **M4** 实心 | `.glass-solid` | 关闭效果态、工具提示、浮层内嵌 | `--glass-solid` | `none` | `--ink-200` | `--r-card` | `--shadow-1` |

**硬约束**：四档的 `backdrop-filter` 一律从 `--blur` 派生。当 `effects` 关闭时，`--blur` 被置为 `0px`，四档自动退化为实心——不允许任何组件保留固定模糊值。

> 修复对象：当前 `TaskBar`(34px) / `TaskView`(28px) / `SearchPanel`(30px) / `GameStore`(10px) 四处定值。

### 3.2 液态玻璃三层结构

**① 折射底** — `backdrop-filter: blur() saturate()`，由材质档提供。

**② 边缘厚度** — 多层 `inset box-shadow`，塑出"玻璃有厚度"：

```css
box-shadow:
  var(--shadow-2),                              /* 外投影 */
  inset 0 1px 0 rgba(255,255,255,.92),          /* 顶部厚边（最亮） */
  inset 0 -1px 0 rgba(255,255,255,.42),         /* 底部反光 */
  inset 1px 0 0 rgba(255,255,255,.50),          /* 左侧 */
  inset -1px 0 0 rgba(255,255,255,.50),         /* 右侧 */
  inset 0 -14px 26px -20px rgba(133,96,26,.30), /* 底部内阴影 → 折射/厚度错觉 */
  inset 0 0 44px rgba(255,255,255,.16);         /* 内雾 */
```

**③ 镜面反光** — 烘焙进元素自身的 `background-image`，跟随指针：

```css
background-image:
  radial-gradient(
    150px 110px at var(--gx, 50%) var(--gy, -40%),
    rgba(255,255,255, calc(.55 * var(--gl, 0))),
    transparent 70%
  ),
  linear-gradient(180deg, rgba(255,255,255,.50), rgba(255,255,255,.14) 44%, rgba(255,255,255,.02));
```

- `--gx` / `--gy`：指针在元素内的百分比坐标。
- `--gl`：0/1，元素是否处于指针悬停。
- 由 `src/composables/useSpecular.ts` 统一驱动（单例 `pointermove` 监听，rAF 节流，命中 `.glass` / `.glass-dense` / `.glass-thin` 时写入）。
- 反光烘焙在 `background-image` 里而非伪元素，保证它绘于内容之下，不遮挡文字，也不引入 `z-index`。

### 3.3 强调色淡底

需要"选中的玻璃块"时，不新造材质，用 Color-Mix 叠加：

```css
background: color-mix(in srgb, var(--accent) 14%, var(--glass-base));
border-color: color-mix(in srgb, var(--accent) 32%, var(--glass-edge));
```

### 3.4 性能红线（硬约束）

项目历史上因 `backdrop-filter` 逐帧重采样出现过明显卡顿，以下为不可违反的规则：

1. 动画只允许碰 `transform` 与 `opacity`。禁止动画 `filter` / `backdrop-filter` / `box-shadow` / `width`。
2. **任何元素在动画进行中必须摘掉 `backdrop-filter`**，用 `--glass-solid` 顶住观感。已实现的先例：
   - `GlassWindow.vue` 开合过渡期间
   - `DesktopShell.vue` `.stage.animating` 期间所有窗口
   - **本次扩展**：任务栏收起/拖拽、Dock 出入场、覆盖层开合
3. 同一屏内同时启用的大面积模糊层（任一边 > 200px）不超过 3 层；小尺寸的 M1 元素（图标、chip、圆形按钮）不受此限。
4. 果冻的 `scale` 上限：小元素（≤24px，如圆形按钮、图标）可到 `1.12`；卡片类不超过 `1.05`；大面积面板不超过 `1.02`。
5. `will-change` 仅在动画开始前临时添加，结束后移除；不得常驻。

---

## 4. 形状与间距

### 4.1 圆角阶梯（全部由 `--radius` 派生）

| 令牌 | 值 | 用途 |
| --- | --- | --- |
| `--r-inner` | `clamp(6px, calc(var(--radius) * .40), 12px)` | 内嵌小件、色块、进度条 |
| `--r-control` | `clamp(8px, calc(var(--radius) * .55), 16px)` | 按钮、输入框、开关 |
| `--r-card` | `clamp(10px, calc(var(--radius) * .72), 20px)` | 小卡片、列表项 |
| `--r-panel` | `var(--radius)` | 主玻璃窗口 |
| `--r-screen` | `clamp(14px, calc(var(--radius) * 1.25), 34px)` | 任务栏、Dock、全屏面板 |
| `--r-pill` | `999px` | 胶囊（唯一允许的定值圆角） |

**硬约束**：设置面板的"卡片圆角"滑块驱动 `--radius`（8–32px），其余五档自动跟随。任务栏/Dock 用 `--r-screen`，因此滑块对它们同样生效——**这是当前断裂点的修复**。

### 4.2 间距（4pt 网格）

`--sp-1:4` `--sp-2:8` `--sp-3:12` `--sp-4:16` `--sp-5:20` `--sp-6:24` `--sp-8:32` `--sp-10:40` `--sp-12:48`

组件内边距取最近档位；允许 `calc()` 组合，但不得出现 5/7/9/11/13 这类非 4 倍数。

---

## 5. 动效系统（果冻）

### 5.1 曲线（四条）

| 令牌 | 值 | 用途 |
| --- | --- | --- |
| `--spring-settle` | `cubic-bezier(.2, .8, .2, 1)` | 位移、尺寸变化（无过冲） |
| `--spring-jelly` | `cubic-bezier(.34, 1.56, .64, 1)` | **果冻**：hover 抬升、press 回弹、图标弹跳 |
| `--spring-out` | `cubic-bezier(.22, 1, .36, 1)` | 入场、退场 |
| `--ease-loop` | `cubic-bezier(.45, 0, .55, 1)` | 循环动画（呼吸、脉冲） |

### 5.2 时长（五档）

| 令牌 | 值 | 用途 |
| --- | --- | --- |
| `--dur-1` | `120ms` | 按下、色调切换 |
| `--dur-2` | `180ms` | hover、按钮反馈 |
| `--dur-3` | `240ms` | 窗口开合、面板切换 |
| `--dur-4` | `320ms` | 大面板展开、页面级过渡 |
| `--dur-5` | `520ms` | 入场编排单张卡片 |

**退场规则**：退场一律比入场快一档（`--dur-3` 入场 → `--dur-2` 退场）。

### 5.3 果冻五式

| 名称 | 触发 | 行为 | 曲线 |
| --- | --- | --- | --- |
| `press-squash` | `:active` | `scale(.94)` 压缩，松手弹回过冲 | `--spring-jelly` |
| `hover-lift` | `:hover` | `translateY(-2px) scale(1.05)`，阴影加深 | `--spring-jelly` |
| `entrance-overshoot` | 入场 | 到 `scale(1.015)` 过冲后回 `1` | `--spring-out` |
| `panel-morph` | 打开/关闭 | 圆角与 scale 同时变化，从 `--r-control` 到 `--r-panel` | `--spring-jelly` |
| `icon-pop` | 点击/切换 | `1 → 1.12 → 1`，单次播放 | `--spring-jelly` |

标准入场关键帧：

```css
@keyframes jelly-rise {
  0%   { opacity: 0; transform: translateY(26px) scale(.94); }
  62%  { opacity: 1; transform: translateY(-3px) scale(1.015); }
  100% { opacity: 1; transform: none; }
}
```

### 5.4 入场编排（staggered）

- 每张卡片延迟 `0.12s`，顺序：桌面图标 → 任务栏 → 窗口（按层级从后到前）。
- 单张时长 `--dur-5`，曲线 `--spring-out`。
- 图表/列表类内部再 stagger 时，间隔 `0.03s`，且总数不超过 10 项。

### 5.5 果冻强度开关

设置面板提供三档：`关闭`（`--spring-jelly` 退化为 `--spring-settle`）、`轻柔`（`cubic-bezier(.3, 1.2, .6, 1)`）、`标准`（默认）。通过根节点内联变量覆盖实现，组件无感知。

### 5.6 无障碍

- `prefers-reduced-motion: reduce` 时：全部 `animation` / `transition` 时长压到 `0.001ms`（保留现有全局兜底），且 `--spring-jelly` 退化为 `--spring-settle`。
- 键盘焦点环：`2px solid color-mix(in srgb, var(--accent) 70%, transparent)`，`outline-offset: 2px`——不可被 `overflow: hidden` 裁掉。

---

## 6. 氛围层

### 6.1 壁纸

```css
background: linear-gradient(160deg, var(--cream-050) 0%, var(--cream-100) 48%, var(--cream-200) 100%) fixed;
```

### 6.2 光晕

三个固定定位的大圆，`filter: blur(120px)`，缓慢浮动（单次循环 18–26s，`--ease-loop`，`prefers-reduced-motion` 下静止）：

| 位置 | 尺寸 | 颜色 |
| --- | --- | --- |
| 左上 | 60% × 46% | `rgba(255,255,255,.08)` |
| 右下 | 52% × 52% | `rgba(160,120,255,.15)` |
| 右上 | 40% × 40% | `rgba(216,169,60,.18)`（暖金，新增以强化奶黄） |

光晕层 `pointer-events: none`，`z-index: 0`，位于所有内容之下。**光晕不参与任何动画合成**——用 `translate` 缓慢位移即可，禁止改 `filter`。

---

## 7. 组件规约

| 组件 | 材质 | 圆角 | 动效 |
| --- | --- | --- | --- |
| `DesktopShell` | 光晕层 | — | 入场编排总控 |
| `GlassWindow` | M2 + 镜面 | `--r-panel` | `panel-morph` 开合、`hover-lift` 标题栏按钮、`press-squash` |
| `TaskBar` | M3 + 镜面 | `--r-screen` | `hover-lift`、`press-squash`、`icon-pop` |
| `DockRail` | M3 + 镜面 | `--r-screen` | `icon-pop`、`entrance-overshoot` |
| `SystemTray` | 无底（M1 圆钮） | `--r-pill` | `hover-lift`、`press-squash` |
| `DesktopIcons` | M1 | `--r-card` | `hover-lift`、选中 `icon-pop` |
| `TaskView` | M3 卡片 + `--scrim` 遮罩 | `--r-screen` | `entrance-overshoot` staggered |
| `SearchPanel` | M3 + 镜面 | `--r-screen` | `panel-morph` |
| `GlassSearch` | M2 | `--r-control` | — |
| `PowerScreen` | M4（实心，开机画面无背景可透） | `--r-card` | 自有时序，只用四条曲线 |
| `ExplorerWindow` | 窗口内 M1 列表项 | `--r-control` | `hover-lift`（限列表项） |
| `SettingsWindow` | 窗口内 M1 | `--r-control` | `press-squash`（色板、开关） |
| `MusicWindow` | 窗口内 M1 | `--r-control` | 播放键 `icon-pop`、唱片呼吸用 `--ease-loop` |
| `GameStore` | M2 卡片 + M1 内部；搜索遮罩 `blur(calc(var(--blur) * .35))` | `--r-card` | `hover-lift`、安装按钮 `press-squash` |
| `Arcade` | M1 选择条 | `--r-pill` | `press-squash` |
| `Game2048` / `Snake` / `WhackAMole` | 棋盘 M1、控件 M1 | `--r-card` | `press-squash`、`icon-pop` |

### 7.1 Vuetify 桥接

`src/plugins/vuetify.ts` 必须显式声明主题，杜绝默认 `#1867C0` 冷蓝泄漏：

```ts
theme: {
  defaultTheme: 'light',
  themes: {
    light: {
      dark: false,
      colors: {
        background: '#F9E4A5',
        surface: 'rgba(255,250,236,0.55)',
        'on-surface': '#3D2B0E',
        primary: '#D99B1E',
        'on-primary': '#3D2B0E',
        secondary: '#8B6AD0',
        success: '#4E9A6A',
        warning: '#D99B1E',
        error: '#D9564A',
        info: '#D99B1E',
      },
      variables: { 'border-radius-root': '14px' },
    },
  },
}
```

组件级 `defaults` 统一圆角与密度，避免每个组件各写一份 `:deep` 补丁。

### 7.2 表单控件统一

`v-text-field` 的三处使用（`ExplorerWindow` / `SearchPanel` / `GlassSearch`）共用一套全局 `.glass-field` 样式，定义在 `style.css`，**不再允许组件内各自覆写**。

---

## 8. 令牌清单

完整可粘贴版本见 `src/style.css` 的 `:root`。运行时可被 store 覆盖的只有这几个：

| 令牌 | 由谁改 | 范围 |
| --- | --- | --- |
| `--accent` | 设置面板 / 账号切换 | 5 套暖调色 |
| `--accent-deep` | 同上 | 随 accent 成对下发 |
| `--accent-contrast` | 同上 | 随 accent 成对下发 |
| `--blur` | 设置面板"背景模糊"滑杆 | 0–40px |
| `--radius` | 设置面板"卡片圆角"滑杆 | 8–32px |
| `--spring-jelly` | 设置面板"果冻强度" | 三档 |

**初值一致性**：`src/style.css` 与 `src/stores/desktop.ts` 必须给出同一组初值（`blur: 28px`、`radius: 26px`）。当前 store 的 `24/20` 会永久覆盖样式表，属缺陷。

---

## 9. 反模式清单

**禁止**

1. 纯色扁平背景（无渐变、无光晕、无玻璃）。
2. 无 `backdrop-filter` 的半透明块——半透明必须有模糊或明确的实心回退。
3. 直角卡片（`border-radius: 0`），除分隔线、进度条外。
4. Bootstrap / Vuetify 默认观感（默认色调、默认圆角、默认阴影）。
5. 纯黑或冷灰的阴影、文字、边框。
6. 组件内写死的 `blur()`、`border-radius`、字号、hex 颜色。
7. `text-transform: uppercase` 与 `letter-spacing` 超过 `0.05em` 的全大写标签（品牌 Logotype 除外，如开机画面的 `ASDL`）。
8. 无信息含义的编号标记（`01 / 02 / 03`）。
9. 与交互无关的自动播放动画（漂浮、闪烁、渐变流动）超过 1 处。
10. 在动画期间保留 `backdrop-filter`。

**当前状态**：P1–P6 已完成，下表全部修复。保留此表作为回归检查清单——若某条重新出现，即为回归。

| 文件 | 曾经的违规 | 现状 |
| --- | --- | --- |
| `TaskBar.vue` | 覆盖材质：`rgba(255,255,255,.26)` + 固定 `blur(34px)` + `999px` | 改用 `.glass-dense`（M3），材质与圆角全部交给令牌 |
| `TaskBar.vue` `TaskView.vue` `GlassWindow.vue` | `#ff3b30` + `#fff` 三处重复 | 统一为 `--danger` / `--on-danger` |
| `DesktopIcons.vue` | 纯黑阴影 `rgba(0,0,0,.1/.14/.16)` | 改用 `.glass-thin` + `--shadow-*` |
| `WhackAMoleGame.vue` | 纯黑内阴影、未注册的 `#a8763c` | `--ink-900` 派生 + 墨色/奶黄混色 |
| `SnakeGame.vue` | 冷蓝兜底 `#007aff`、未注册食色 `#e2802e` | 画布改从令牌读色；食物用 `--danger`，并监听主题变化重绘 |
| `TaskView.vue` `SearchPanel.vue` `GameStore.vue` | 固定 `blur()`，不听"背景模糊"滑块 | 全部改为从 `--blur` 派生 |
| `PowerScreen.vue` | 8+ 未注册色（`#4a3208`、`#fff6dc`、`#2b1f0d`…） | 全部换为奶黄/墨色令牌，近黑场景除外（见下） |
| `Game2048.vue` | 内联 `fontSize` | 移到 `.g-cell.small` 类，用 `--fs-display` / `--fs-subtitle` |
| 全站 | 9 种 easing、约 20 种时长、15+ 种圆角魔法值 | 收敛为 4 条曲线、5 档时长、6 档圆角 |

**文档化的例外**（仅此三处，不得扩散）：

1. **开机/关机序列**使用超长时长（1.0–1.8s）而非五档时长——它是一次性的页面级编排；但曲线仍只用那四条。
2. **已关机画面**是全站唯一允许近黑的场景，底色由 `--ink-900` 与黑混色派生（关机后屏幕本就该是暗的）。
3. **品牌 Logotype** `ASDL` 允许全大写 + `letter-spacing: .16em`。
4. `border-radius: 50%`（正圆）、`2px/3px`（进度条与指示条）不受圆角阶梯约束。

---

## 10. 迁移对照表

| 旧值 | 新令牌 |
| --- | --- |
| `rgba(255,255,255,.26)` | `--glass-thick` |
| `rgba(255,255,255,.55/.62)` | `--glass-base` |
| `rgba(255,255,255,.32)` | `--glass-thin` |
| `rgba(255,255,255,.9/.92/.95)` | `--glass-solid` / `--glass-edge-strong` |
| `rgba(255,255,255,.6/.72/.8)` | `--glass-edge` |
| `rgba(74,56,20,.07/.08)` | `--ink-050`（.06）/ `--ink-100`（.10） |
| `rgba(74,56,20,.12/.14)` | `--ink-200`（.16） |
| `rgba(74,56,20,.18)` | `--ink-300`（.26） |
| `rgba(74,56,20,.26)` | `--ink-300` |
| `#ff3b30` | `--danger` |
| `#007aff` | `--accent`（默认蜂蜜） |
| `#e2802e` | `--warning` / `--accent-deep` |
| `rgb(0,0,0,.1)` 系列阴影 | `--shadow-1/2/3` |
| `border-radius: 12px/14px/16px/18px` | `--r-control` / `--r-card` |
| `border-radius: 999px` | `--r-pill` |
| `border-radius: 50%` | 保留（正圆） |
| `0.18s ease` / `0.2s ease` | `--dur-2` + `--spring-settle` |
| `0.22s/0.24s/0.26s cubic-bezier(.2,.8,.2,1)` | `--dur-3` + `--spring-settle` |
| `0.3s/0.32s/0.34s cubic-bezier(...)` | `--dur-4` + `--spring-settle` |
| `cubic-bezier(.16,.84,.28,1)` | `--spring-out` |
| `ease-in-out` / `ease-out` | `--ease-loop` / `--spring-out` |
| `font-size: 10.5px` | `--fs-micro` |
| `font-size: 11px/11.5px` | `--fs-caption` |
| `font-size: 12px/12.5px` | `--fs-label` |
| `font-size: 13px` | `--fs-body` |
| `font-size: 13.5px` | `--fs-subtitle` |
| `font-size: 15px` | `--fs-title` |
| `font-size: 21px` | `--fs-display` |
| `clamp(46px,8vw,84px)` | `--fs-hero` |

---

## 11. 验收清单

- [ ] 拖动"背景模糊"到 0：任务栏、Dock、搜索面板、任务视图、商店遮罩全部同步变实心。
- [ ] 拖动"卡片圆角"到 8 与 32：任务栏与 Dock 同步变化。
- [ ] 关闭"透明与模糊效果"：无任何残留 `backdrop-filter`。
- [ ] 切换 5 套强调色：无冷色残留（重点检查关闭按钮、进度条、选中态、游戏画布）。
- [ ] 果冻强度切到"关闭"：所有过冲消失，动作变平顺。
- [ ] `prefers-reduced-motion: reduce`：无非必要动画。
- [ ] 键盘 Tab 遍历：焦点环可见且不被裁切。
- [ ] 正文对比度 ≥ 4.5:1（`--text` on `--glass-base` on `--cream-100`）。
- [ ] `npm run build` 通过，无 TS 错误。
- [ ] 窗口开合、任务栏收起、Dock 出入场期间，任一时间点同时启用的模糊层 ≤ 3。

---

## 12. 落地映射

| 关注点 | 落点 |
| --- | --- |
| 令牌全部定义 | `src/style.css` 的 `:root` |
| 四档材质类 | `src/style.css` 的 `.glass-thin` / `.glass` / `.glass-dense` / `.glass-solid` |
| 镜面反光驱动 | `src/composables/useSpecular.ts`，在 `DesktopShell.vue` 挂载 |
| 强调色板 | `src/data/palette.ts`（唯一来源，`accounts.ts` 与 store 都从这里取） |
| 运行时令牌下发 | `src/stores/desktop.ts` 的 `tokens` computed → `DesktopShell.vue` 的 `:style` |
| 效果开关 | `DesktopShell.vue` 的 `:data-effects` → 命中 `style.css` 的 `[data-effects='off']` |
| 字体 | `index.html` 的 Google Fonts 链接 + `style.css` 的 `--display-font` / `--body-font` |
| Vuetify 桥接 | `src/plugins/vuetify.ts` 的 `themes.light.colors` 与 `defaults`；控件圆角在 `style.css` 用 `.v-application` 前缀压过 vuetify/styles |
| 表单控件统一皮 | `style.css` 的 `.glass-field`（组件内不再各自覆写） |

### 已知取舍

1. **中文不圆**：按既定方案，中文回落 PingFang SC / Microsoft YaHei UI，本身不带圆角。若要中文也圆，只需替换字体令牌的中文段，追加阿里妈妈方圆体等子集化自托管字体，其余代码不动。
2. **镜面反光只在指针设备上可见**：触屏设备没有 hover，反光层始终为 `--gl: 0`，即不可见——不影响观感与可读性。
3. **大尺寸模糊层的性能**：项目历史上出现过 `backdrop-filter` 逐帧重采样的卡顿，因此所有开合/拖拽过程都会临时摘掉模糊（用 `--glass-solid` 顶替）。新增动画时必须沿用这条规则。

