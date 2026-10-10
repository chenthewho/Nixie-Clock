# Nixie-Clock

> 辉灯管时钟，跑在区块链上

单文件、零依赖、零图片：`index.html` 用 Canvas 2D 把 `时钟.pen` 设计稿逐像素还原成网页时钟。
跟随系统时间走时，数字起辉跳动，可直接安装到桌面（PWA）。

```bash
# 安装到桌面需要 http(s) 来源；本地预览用任意静态服务器即可
python3 -m http.server 8080     # 然后打开 http://localhost:8080/
```

直接双击 `index.html` 也能看（file:// 下除 PWA 安装外功能一致）。

## 这是什么

一排 6 只辉光管 + 2 个分隔灯，上面一行日期 —— 画面完全由代码在运行时绘制：
玻璃罩、蜂窝阳极网、玻璃反光、金属底座、地面光池，没有任何图片或外部依赖。

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

## 功能

- **走时**：每秒同步系统时间，六只管子分别显示 时 分 秒。
- **起辉跳动**：数字变化时先随机跳字抖动约 60% 时长，再「过亮」落定。
- **忽明忽暗**：每只管子独立随机游走 ±7.5%、极快微颤，外加 0.7~3.6 秒一次的随机闪断；
  光晕、光池、环境暖光按设计稿的 `u_flicker` 各自闪烁。
- **PWA 安装**：`manifest.webmanifest` + `sw.js` 离线缓存；页面底部「下载到桌面」按钮
  走 `beforeinstallprompt`，iOS 下会提示「分享 → 添加到主屏幕」。
- **自适应**：任意窗口尺寸等比缩放居中，画布按设备像素比渲染。

## URL 参数

| 参数 | 作用 | 例子 |
| --- | --- | --- |
| `t` | 固定时间（默认跟随系统） | `?t=21:48:05` |
| `d` | 固定日期 | `?d=10/10` |
| `w` | 固定星期 | `?w=SATURDAY` |
| `static` | 关闭所有动画，便于与设计稿逐像素比对 | `?static=1` |
| `icon` | 图标导出模式（`1` 常规 / `2` maskable） | `?icon=1` |

例：`index.html?static=1&t=21:48:05&d=10/10&w=SATURDAY` 即为设计稿定格状态。

## 文件

```
index.html                 页面与全部绘制逻辑（设计空间 1920×1080）
manifest.webmanifest       PWA 清单
sw.js                      Service Worker（应用外壳 cache-first）
fonts/                     Barlow Condensed Thin + Inter（本地字体，可离线）
icons/                     192 / 512 / maskable / apple-touch
```

## 可调参数

`index.html` 顶部的 `DESIGN` 对象集中了全部设计常量（与设计稿一一对应）：
`ambient` / `date` / `clock` / `pool` / `tube`（halo、body、frame、mesh、digit、rim、shell、base）/
`colon`。玻璃轮廓与氖泡用的是设计文件里的原始路径 `GLASS_D`、`BULB_D`。

## 与设计稿的差异

以 1920×1080 逐像素比对，当前平均误差约 8.6/255。剩余差异集中在：

1. 数字字形 —— 设计稿用的是 pen.dev 自己的 Barlow Condensed 渲染，笔画宽度比本地
   woff2 略宽（宽度差约 8%，高度已对齐到 240px 内）；
2. 玻璃罩左壁 —— 设计稿的边缘光更锐利，本实现是 22px 描边 + 8px 模糊后按轮廓裁剪；
3. 设计稿的 SDF 边缘光在轮廓外仍有极淡的一圈，本实现按轮廓裁掉了。
