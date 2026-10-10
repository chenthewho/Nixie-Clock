# Nixie-Clock

> 辉灯管时钟，跑在区块链上

零依赖、零图片：整个站点只有 HTML / CSS / 一点原生 JS，画面由 Canvas 2D 把
`时钟.pen` 设计稿逐像素还原出来。

- `index.html` —— **官网（Landing）**：机箱里实时跑着的时钟预览 + 功能 / 协议 / 下载。
- `clock.html` —— **时钟本体（Wallpaper）**：1920×1080 的辉光管时钟，跟随系统时间走时，
  数字起辉跳动，可直接安装到桌面（PWA）。

```bash
# 安装到桌面需要 http(s) 来源；本地预览用任意静态服务器即可
python3 -m http.server 8080     # 官网 http://localhost:8080/ ，时钟 http://localhost:8080/clock.html
```

直接双击 `index.html` 也能看（file:// 下官网的时钟预览正常，PWA 安装不可用）。

## 这是什么

官网把时钟装进一台米色机箱里：1920 × 1080 的壁纸按设计稿裁进 1680 × 1000 的窗口，
里面是**同一份渲染器**实时画出来的时钟；机箱外面是暖色工业风的排版与文案。
时钟本体则是一排 6 只辉光管 + 2 个分隔灯，上面一行日期 —— 玻璃罩、蜂窝阳极网、
玻璃反光、金属底座、地面光池全部由代码在运行时绘制，没有任何图片或外部依赖。

## 设计稿对应关系

本作按 pen.dev 设计稿 `时钟.pen`（`~/Documents/pendev/`）还原，设计空间固定
**1920 × 1080**，尺寸 / 颜色 / 圆角 / 渐变停靠点 / 字体全部直接取自设计文件：

| 设计稿节点 | 还原方式 |
| --- | --- |
| `Nixie Clock — Wallpaper` | 页面主体，1920×1080 设计空间等比缩放居中 |
| `Tube / Halo` | `glow.glsl` → 径向渐变 `pow(1-d, u_falloff)` + 闪烁项 |
| `Tube / Glass Body` | 设计文件里的原始 SVG 路径 + 垂直渐变 + 内阴影 |
| `Tube / Glass / Mesh` | `mesh.glsl` → 逐像素六边形线框（边线 + 芯线 + 暗角） |
| `Tube / Glow Far·Near·Digit` | Barlow Condensed Thin 340px，三层模糊叠加 |
| `Tube / Glass Shell` | `glass-v2.glsl` → 边缘光 + 高斯高光带 + 壁厚柔光 + 管内反射 |
| `Tube / Base` | 圆角矩形 + 竖向渐变 + 侧向阴影 + 暖色上下压边 |
| `Nixie Colon` | 灯杆 / 氖泡 / 电极 / 辉光 / 底座，逐节点还原 |
| `Wallpaper / Ambient` | `ambient.glsl` → 暖光晕 + 底色 + 暗角 + 颗粒 |
| `Wallpaper / Light Pool` | `glow.glsl`，落在地面的一道暖光 |

> 四个 GLSL 着色器按设计稿参数逐行移植为 Canvas 2D 等价实现
> （径向渐变 / 逐像素六边形 / 描边场 / 高斯高光），没有引入 WebGL。

### 官网（`Nixie Clock — Landing`）

设计稿 `L6OXlR` 是 1920 × 3804 的长页，按 1920 宽逐块还原（屏幕变窄时等比收窄、
卡片与终端转到多行）：

| 设计稿节点 | 还原方式 |
| --- | --- |
| `Nav` / `Nav Rule` | 米色导航条（`#C4B69A`）+ 4px 分隔线，右侧「下载到桌面」接 PWA 安装 |
| `Hero` | 眉标 / 主标题 / 副标题 / 主按钮 / 规格行，全部取自设计稿的字号与字距 |
| `Monitor Bezel` | 1740×1150 机箱：散热栅（26 条）、四角螺丝、铭牌 `NIXIE NT-6`、PWR 灯与两颗旋钮 |
| `Wallpaper Preview` | 1680×1000 圆角窗口，里面是 `clock.js` 的**实时**时钟，按 -120 / -40 裁切；上面叠一层 Scanlines |
| `Features` | 4 张模块卡（图标框 / 编号 / 标题 / 正文 / 底部散热肋） |
| `Protocol Card` | TapeOut 协议卡：铭牌 + 绿色 LIVE 灯、标题段、终端窗口与三条要点 |
| `CTA Section` | 下载卡：标题 / 正文 / 主按钮 / `STATUS READY` 读数条 |
| `Caution Stripe` / `Footer` | 45° 警示斜纹（10px 琥珀 + 10px 深底）+ 页脚 |

> 与设计稿逐块比对（1920 宽）：导航 104px、机箱 1740×1150、功能卡 389 宽、
> 协议卡 1664×595、页脚 105px，位置与尺寸误差都在 1~2px 内。
> 唯一的系统性差异是文本行高 —— 设计稿用字体自带行高，本实现按设计稿标注的
> 行高（如正文 28px、终端 17px）逐条对齐。

## 功能

- **走时**：每秒同步系统时间，六只管子分别显示 时 分 秒。
- **起辉跳动**：数字变化时先随机跳字抖动约 60% 时长，再「过亮」落定。
- **忽明忽暗**：每只管子**独立**呼吸，节奏很慢、幅度很浅 —— 亮度用时间常数 2.6 秒的
  随机游走漂移（±2%），叠一层 0.19Hz × 0.07Hz 的极慢微颤（±0.5%），另外平均十几秒才
  偶发一次 40~90ms、只压暗 8%~16% 的浅闪断（带正弦包络，不会硬闪）。
  光晕 / 光池 / 分隔灯按设计稿的 `u_flicker` 各自闪烁，频率与幅度各压了一档。
  （设计稿的 `ambient` 没有 `u_flicker`，所以**背景是静态的**，不参与闪烁。）
- **背景抖动**：环境底色是 0.022 这种极浅的渐变，直接画会只剩 7 个灰阶、横带高达 240px。
  叠一层**静止**的中灰噪声（`overlay`，幅度对齐设计稿 grain 的 ±0.0055）把横带打散到 6px
  —— 噪声必须静止，一动就变成「带边一直在爬」。
- **PWA 安装**：`manifest.webmanifest` + `sw.js` 离线缓存（官网与时钟都进外壳）；
  官网导航 / 主按钮与时钟页底部的「下载到桌面」共用 `pwa.js`：能装就走
  `beforeinstallprompt`，iOS 下提示「分享 → 添加到主屏幕」。
- **自适应**：官网按 1920 设计稿等比收窄（4 卡 → 2 卡 → 1 卡，终端转到要点下方）；
  时钟在任意窗口尺寸下等比缩放居中，画布按设备像素比渲染。
- **省电**：官网的机箱预览滚出视口即停帧（`IntersectionObserver` + `NixieClock.start/stop`），
  `prefers-reduced-motion` 下预览直接定格。

## URL 参数（`clock.html`）

| 参数 | 作用 | 例子 |
| --- | --- | --- |
| `t` | 固定时间（默认跟随系统） | `?t=21:48:05` |
| `d` | 固定日期 | `?d=10/10` |
| `w` | 固定星期 | `?w=SATURDAY` |
| `static` | 关闭所有动画，便于与设计稿逐像素比对 | `?static=1` |
| `icon` | 图标导出模式（`1` 常规 / `2` maskable） | `?icon=1` |

例：`clock.html?static=1&t=21:48:05&d=10/10&w=SATURDAY` 即为设计稿定格状态。

## 文件

```
index.html                 官网（Landing）：全部样式内联，1920 设计稿 + 自适应
clock.html                 时钟骨架（画布 / 安装按钮，设计空间 1920×1080）
clock.js                   NixieClock.create() —— 全部绘制与动画逻辑
pwa.js                     NixiePWA —— 安装按钮 / Service Worker 注册
manifest.webmanifest       PWA 清单（start_url = clock.html）
sw.js                      Service Worker（应用外壳 cache-first）
fonts/                     官网：Chakra Petch / ZCOOL QingKe HuangYou / IBM Plex Mono / Noto Sans SC
                           时钟：Barlow Condensed Thin / Inter —— 全部本地子集，可离线
icons/                     192 / 512 / maskable / apple-touch
```

> 官网用的四款中英文字体按页面实际用到的 292 个字符向 Google Fonts 取子集，
> 合计约 90KB；加上时钟的字体，整个站点离线可用且没有任何第三方请求。

## 可调参数

- **画面**：`clock.js` 顶部的 `DESIGN` 对象集中了全部设计常量（与设计稿一一对应）：
  `ambient` / `date` / `clock` / `pool` / `tube`（halo、body、frame、mesh、digit、rim、shell、base）/
  `colon`。玻璃轮廓与氖泡用的是设计文件里的原始路径 `GLASS_D`、`BULB_D`。
- **忽明忽暗**：`clock.js` 主循环里的 `WALK_TAU`（游走时间常数，越大越慢）、`WALK_AMP`
  （游走幅度）、微颤行、以及闪断的 `dropDur / dropDepth / nextDrop` 三处；
  光晕闪烁另有 `GLOW_SPEED` / `GLOW_AMP` 两个全局倍率（`tubeFrame` 上方）。

## 与设计稿的差异

以 1920×1080 逐像素比对，当前平均误差约 8.6/255。剩余差异集中在：

1. 数字字形 —— 设计稿用的是 pen.dev 自己的 Barlow Condensed 渲染，笔画宽度比本地
   woff2 略宽（宽度差约 8%，高度已对齐到 240px 内）；
2. 玻璃罩左壁 —— 设计稿的边缘光更锐利，本实现是 22px 描边 + 8px 模糊后按轮廓裁剪；
3. 设计稿的 SDF 边缘光在轮廓外仍有极淡的一圈，本实现按轮廓裁掉了。
