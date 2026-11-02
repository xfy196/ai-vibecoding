# 制作记录 · 《此生不换》立体书 MV

成片：`out/此生不换_立体书MV_全曲.mp4` — 1920×1080 / 30fps / 4:23.00 / 7890 帧 / H.264 + AAC 224k / 92MB / `yuv420p(tv, bt709)` / faststart。
联系表：`out/contact.jpg`。帧序列保留在 `out/frames/`（1.6G），改完某几场可只补渲那一段再重编码。

## 相对模板改了什么

| 位置 | 改动 | 为什么 |
| --- | --- | --- |
| `core.js` · `cameraAt` | 推镜周期从「52 秒」改成按 `SPEC.duration` 算（前 84% 推到 1.36，最后 24 秒回落到 0.86） | 263 秒的片子沿用 52 秒的推镜曲线，后半段就完全不动了 |
| `core.js` · `openProgress` | 新增开场：`0 = 书合着`，`SPEC.opening.start` 起封面从右侧掀开 | 模板里书永远是摊开的，全曲版有 31.6 秒前奏，需要「开书」这一下 |
| `core.js` · `coverProgress` / `giftProgress` | 合书与礼物的时间点从写死 `+1.0 / +1.62` 改成读 `SPEC.close` | 最后一场有 22 秒，合书必须落在 245 而不是 242 |
| `core.js` · 背景补边 | 镜头拉到 1 以下时，`bgLayer` / `deskLayer` 按 `1/scale` 放大绘制 | 不补的话画面四周会露出一圈画布底色（拉远时最明显） |
| `core.js` · `drawCredits` | 新增开屏卡：屏幕空间，760×340，四行 Songti SC + 烫金短线 + 红印「不换」 | 全曲版需要一个报歌名/演唱/词曲的开屏 |
| `core.js` · `drawTone` | 每场一个 `tone`（warm / cool / gold / dusk / night），全屏叠加极淡色温 | 18 个桥段要撑 35 场，靠色温与机位区分「同一桥段第二次出现」 |
| `scenes.js` · `sceneFireworks` | cue 从 4 个扩展到 8 个（按 `dur > 5` 分支），末尾加余烬沿页边蔓延 | 「爱像烈火般蔓延」要撑 8.2 秒，原来 2 秒就演完了，后面全是死帧 |
| `analyze.mjs` | `s16le` 失败时退回「解码成 wav 再剥 RIFF 头」 | 本机只有 Remotion 的精简 ffmpeg，没有 s16le muxer |
| `mux.mjs` | `afade` 换成 `volume` 帧级包络；中间文件 `.m4a` → `.mp4` | 精简 ffmpeg 既没有 afade 滤镜，也没有 m4a muxer |

## 35 场与桥段复用

18 个桥段撑 35 场：17 个各用两次，`ending` 用一次（17×2+1=35）。
同一 id 第二次出现时换 `tone`，必要时换时长（例如 `fireworks` 第一次 8.2 秒满开+余烬，第二次只 4 秒两簇小火）。

## 出片时踩的两个坑

1. **色彩范围**：帧是 JPEG（full range），直接 `-pix_fmt yuv420p` 出来是 `yuvj420p(pc)`，换个播放器就会偏白。最终统一转成 `yuv420p(tv, bt709)`：
   `-vf "scale=in_range=full:out_range=tv" -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv`
2. **合片被中途打断**：mp4 只写了一半（`moov atom not found` 就是典型症状）。补救办法是重跑 `mux.mjs`；如果目录里多了 `.xxx.wb-restore.<pid>` 文件，那通常是完整的成片被系统临时挪走了，`mv` 回来即可。

## 试过但放弃的

- **火苗沿页底舔上去**：试渲染后看着像一排路障锥，删掉了；8 秒的烟花场改成「烟花延长存活 + 余烬下落」。
- **`tone` 用 multiply 加深**：比 screen 更接近参考片的暖米色，但需要整片重渲 30 分钟，收益太小，保留 screen。

## 时间轴关键点

- 0.00 开场：书合着，画面前景是歌名卡
- 6.50 卡上浮淡出，封面同时掀开
- 31.60 第一句「时光穿不断」起唱
- 119.08 副歌末句，125.10 花谢成星
- 198.15 十三秒间奏：铅笔速写
- 240.99 最后一句；245.0 封面合上；246.6 红线礼物；248 起镜头拉到桌面
- 261.5 起暖光淡出，263.00 收

## 环境备忘

- `ffmpeg` 只有 Remotion 精简构建：需 `DYLD_LIBRARY_PATH=<compositor-darwin-x64>`，已封装成 `/tmp/ffwrap.sh`，用 `FFMPEG=/tmp/ffwrap.sh` 调用
- `node_modules` 软链到 `../huiyi-mv/node_modules`（p5 + puppeteer-core 都在），不必重新装
- 全片渲染速率约 4.3–4.5 帧/秒，7890 帧约 30 分钟
