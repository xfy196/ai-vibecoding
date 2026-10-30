# 换机续跑说明 ·《忘记时间》水彩 MV

## 这是什么
胡歌《忘记时间》（4:32.14）的手绘水彩风 MV，9 章 39 镜。
每帧都是时间 `t` 的**纯函数**（无 `Math.random()`、无跨帧状态），所以同一份代码在任何机器上渲出同一帧。
渲染器会**跳过已存在的帧**，因此可以随时中断、换机续跑。

## 当前进度（导出于本机）
- 已渲染 **978 / 3266 帧**（约 30%，对应前 81.5 秒）
- 规格：**12 fps**，1920×1080
- 未生成 MP4（还差 2288 帧）

## 另一台机器需要什么
| 依赖 | 说明 |
|---|---|
| Node.js 20+ | 运行 `render.mjs` |
| Google Chrome | 无头渲染；脚本会自动在常见路径找 |
| ffmpeg | **只在最后合成 MP4 时用**；macOS 可 `brew install ffmpeg`，或 `npm i -D ffmpeg-static` |

> 本目录里的 `bin/ffmpeg` 是 macOS **x86_64** 静态版，换平台（Apple Silicon / Linux / Windows）请自行安装，不要照搬。

## 拷到新机器的清单
```
wangji-shijian/
├── src/  studio.html  render.mjs  package.json  pnpm-lock.yaml  package-lock.json
├── tools/            # render_all.sh / encode.sh（已做成不依赖特定路径）
├── assets/           # song.mp3 / song.lrc / fonts/mashanzheng.woff2（字体已本地化，不用联网）
└── out/frames/       # 已渲染的 978 帧（约 669 MB）
```
**不要拷 `node_modules`**（含符号链接和平台相关文件），到新机器重装：

```bash
cd wangji-shijian
npm install            # 或 pnpm install
```

如果你不想传 669 MB 的帧，也可以只拷代码从 0 开始（大约 1.5 小时）。

## 续跑

```bash
cd wangji-shijian
FPS=12 ./tools/render_all.sh     # 自动跳过已有帧；每 12 秒一块，崩了自动重试
./tools/encode.sh                # 全部渲完后合成 out/忘记时间_水彩MV.mp4
```

⚠️ **`FPS` 必须是 12。** 帧文件名 `f00000.jpg` 对应的时间点是 `帧号 / fps`，换 fps 会让已有帧和代码错位。

## 机器慢的话
渲染是 GPU/JS 密集的（每帧约 1.7 s 空闲，被占用时能掉到 5 s）。实测多开 worker **没有收益**：
集显是瓶颈，1 个和 3 个 worker 的总吞吐几乎一样。脚本固定 `--workers=1`。

想更快可以降 `--fps`（改渲染脚本里的 FPS），但 12 已经是手绘"一拍二"的底线了。

## 关键文件
| 文件 | 内容 |
|---|---|
| `STORYBOARD.md` | 9 章 39 镜的分镜表（时间 / 歌词 / 镜头 / 读点） |
| `src/config.js` | 时长 272.14s、BPM 65.4、offset 0.486 |
| `src/karaoke.js` | 27 行歌词的逐字卡拉OK表（时间=歌曲时间） |
| `src/set.js` | 水彩世界：天空 / 山脊 / 路 / 雨 / 水 / 巨钟 / 枫叶 / 花瓣 / 红线 / 角色 |
| `src/scenes/c01…c09.js` | 9 章场景代码 |
| `ANIMATION_GUIDE.md` | p5.brush 引擎与动画原则（模板自带） |

## 已知的坑（踩过）
1. **p5.brush 是乘法叠色**。`fill` 在纸上会淡成实测色的样子，`wash` 更浓且**有"浅底"**——画不到真正深的夜。
   暖冷两层叠在一起会立刻发灰，所以天空只用同色系压深，暖光靠 `glow()`。
2. **Chrome 会中途崩**（`Target closed`，约 400–450 帧），所以必须分块渲染。
3. **别让字体走网络**。原先 `<link>` 拉 Google Fonts，无网络时 `window.ready` 永远不置位，渲染直接挂。
   现在字体已下载到 `assets/fonts/`，且字体加载加了 4 秒超时兜底。
4. 进程要真正脱离终端才会在换手时存活：macOS 上没有 `setsid`，用 `screen -dmS xx bash -c '...'`。
