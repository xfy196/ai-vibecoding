# 富士山下 MV 制作

陈奕迅《富士山下》的 MV 工程。已定风格 **D · 证物档案**（俯拍 flat-lay / 物证标签），正片做完在渲染。

- 素材：`reference/song.mp3`（4:19 / 320kbps）、`reference/song.lrc`
- 成片规格：1920×1080 / 30fps，取 0:00–4:02（前奏 22 秒留给片名，唱完「解咒」收）
- 口径：Canvas 2D 逐帧确定性绘制 → puppeteer-core 驱动本机 Chrome 截图 → ffmpeg 合原曲

## 片子是什么

分手之后，把这六件东西装进证物袋，编上号，写进卷宗。标题「解咒」，结论是：**申请"私有"——驳回**。

| 编号 | 物证 | 在片中的作用 |
| --- | --- | --- |
| 001 | 风褛 / OLD COAT | 磨到有襟花；最后被划开袋子取出来 |
| 002 | 车票 ×2 | 同日同车次，新宿→河口湖，09:42 |
| 003 | 花瓣 | 「火化」——袋角被烧穿一个洞 |
| 004 | 石头 | 翻面，底面刻着 2014.02.14 |
| 005 | 试管 | 墨在 207.7s 之后慢慢消失（「找不到」） |
| 006 | 钥匙 | 系着红线，是最晚入画的一件 |

三枚「私有 / DENIED」章落在 72.7 / 153.5 / 198.2，最后一枚被大红叉否掉；236.5 落「解咒 / CASE CLOSED」，001 的封条脱落，007 号「解咒 / RELEASED」标签掉在纸上。

## 先看这个

- **`STYLES.md`** — 四个方向的完整提案（A 雪夜胶片 / B 纸艺立体书 / C 水墨 / D 证物档案）与逐句分镜。
- **`out/previews/D.png`** — 美术定稿参考。
- **`public/index.html`** — 正片，Chrome 直接打开就能逐帧看（`window.renderPNG(t)`）。

## 目录

```
富士山下mv制作/
├─ STYLES.md            风格提案与分镜
├─ reference/           原曲、LRC
├─ data/
│  ├─ spec.json         时长 / 帧率 / 段落 / 44 句词时间轴（唯一"总谱"）
│  └─ lyrics.json       逐句时间 + 题眼
├─ public/
│  ├─ index.html        画布与加载顺序
│  └─ js/
│     ├─ util.js        rng / 缓动 / 关键帧 / 画布小工具
│     ├─ props.js       六件道具的离屏预渲染（含证物袋、标签、印章）
│     ├─ fx.js          字距 / 手绘线 / 样条 / 噪点 / 投影
│     ├─ sheet.js       档案纸、桌面、登记卡
│     ├─ items.js       轨迹、标签、红线、印章、解咒开袋
│     ├─ film.js        镜头、批注、字幕、叠加、总装
│     └─ boot.js        初始化与 renderFrame / renderPNG 接口
├─ scripts/
│  ├─ parse-lrc.mjs     LRC → data/lyrics.json
│  ├─ analyze.mjs       BPM / 首拍 / 能量 → audio/analysis.json
│  ├─ keyart.mjs        风格试片 → out/previews/*.png
│  ├─ render.mjs        正片逐帧渲染 → out/frames/
│  └─ mux.mjs           帧序列 + 原曲 → out/*.mp4
├─ bin/ffmpeg           项目自带的 ffmpeg（软链，换机器记得改）
└─ out/                 产物
```

## 命令

```bash
npm install

npm run stills                      # 关键帧预检 → out/stills/
node scripts/render.mjs --stills 22 72.7 137 232   # 指定时间点
node scripts/render.mjs --from=0 --to=300          # 只渲一段（帧号）

npm run render                      # 全片 → out/frames/（约 8–15 分钟）
npm run mux                         # 合片 → out/*.mp4
```

## 约定

- 所有绘制都是 `t` 的确定性函数；随机数只走 `MV.util.rng(seed)`，不用 `Math.random`，所以同一帧永远一样。
- 画面空间：档案纸 2160×1240，四周 90px 留白烘焙投影；相机在纸坐标里推拉，推近时自动夹住不拍到纸外。
- 字幕是屏幕空间的「打字机转录条」：左下纸条 + 红条 + `TRANSCRIPT · SIDE A` + 行号，逐字出现、题眼标红。
- 字体：宋体 `Songti SC`、等宽 `SF Mono`、`PingFang SC`。换机器要确认这三个字体在。

## 已知情况

- 曲速分析给的是 **69 BPM / 每拍 0.87s**（半拍感），首拍 0.77s。
- 44 句词的最后一句「送赠你解咒」在 3:52.0，之后 10 秒器乐收尾。
- `bin/ffmpeg` 是指向本机 imageio-ffmpeg 的软链；换机器就删掉软链、装 `brew install ffmpeg`，或设 `FFMPEG=/path/to/ffmpeg`。
- 道具按 dpr 2 预渲染，镜头 zoom 超过 2 会开始发软；目前最紧的一档在 1.95。
