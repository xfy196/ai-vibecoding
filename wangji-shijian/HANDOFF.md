# 换机续跑说明 ·《忘记时间》水彩 MV

## 这是什么
胡歌《忘记时间》（4:32.14）的手绘水彩风 MV，9 章 39 镜。
每帧都是时间 `t` 的**纯函数**（无 `Math.random()`、无跨帧状态），所以同一份代码在任何机器上渲出同一帧。
渲染器会**跳过已存在的帧**，因此可以随时中断、换机续跑。

## 当前进度（已完工 · Windows / RTX 3060 Ti）
- 已渲染 **3266 / 3266 帧**，无缺帧、无损坏帧
- 规格：**12 fps**，1920×1080
- **MP4 已生成：`out/忘记时间_水彩MV.mp4`**
  - 4:32.11，314 MB，H.264 High / yuv420p / 1920×1080 / 24fps 容器（12fps 一拍二）
  - 音轨 AAC-LC 44.1 kHz 立体声 192k，已混入 `assets/song.mp3`
  - 色彩：bt709 + **limited range (tv)**
- 本机实测：单 worker 约 **1.5 s/帧**，全片渲染约 **80 分钟**（23 块 × 12 秒，0 块失败）

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
└── out/frames/       # 已渲染的 3266 帧（约 2.1 GB）
```
**不要拷 `node_modules`**（含符号链接和平台相关文件），到新机器重装：

```bash
cd wangji-shijian
npm install            # 或 pnpm install
```

如果你不想传 2.1 GB 的帧，也可以只拷代码从 0 开始（RTX 3060 Ti 上约 80 分钟）。
直接拷 `out/忘记时间_水彩MV.mp4` 也够了——成片已经渲完。

## 续跑

```bash
cd wangji-shijian
FPS=12 ./tools/render_all.sh     # 自动跳过已有帧；每 12 秒一块，崩了自动重试
./tools/encode.sh                # 全部渲完后合成 out/忘记时间_水彩MV.mp4
```

⚠️ **`FPS` 必须是 12。** 帧文件名 `f00000.jpg` 对应的时间点是 `帧号 / fps`，换 fps 会让已有帧和代码错位。

## 机器慢的话
渲染是 GPU/JS 密集的。**实测多开 worker 没有收益**：RTX 3060 Ti 上 1 个 worker 1.53 s/帧，3 个 worker 1.47 s/帧（4% 差距，还更容易撞 `Target closed`）。
真正的瓶颈是浏览器里 p5.brush 的 JS 笔刷计算，不是显卡。脚本固定 `--workers=1`。

想更快可以降 `--fps`（改渲染脚本里的 FPS），但 12 已经是手绘"一拍二"的底线了。

## Windows 上跑（本次实际走的路径）
```bash
# 1) 依赖（跳过 ffmpeg-static：机器上已装 winget 版 ffmpeg）
npm install --omit=dev

# 2) Chrome 不在 render.mjs 的默认搜索路径里，必须显式给
export CHROME_PATH="C:/Users/<你>/AppData/Local/Google/Chrome/Application/chrome.exe"

# 3) 渲染（MSYS2 bash；提示 tee/command not found 就用重定向）
CHUNK=12 FPS=12 bash tools/render_all.sh > out/render.log 2>&1

# 4) 合成
bash tools/encode.sh
```
Git Bash / MSYS2 里的 `bash` 能直接跑 `tools/*.sh`，但 `tee`、`wc -l` 之类不一定都有，报错就退回 `> file 2>&1`。

## 关键文件
| 文件 | 内容 |
|---|---|
| `STORYBOARD.md` | 9 章 39 镜的分镜表（时间 / 歌词 / 镜头 / 读点） |
| `src/config.js` | 时长 272.14s、BPM 65.4、offset 0.486、lyricOffset 0（字幕整体微调） |
| `src/karaoke.js` | 27 行歌词的逐字卡拉OK表（时间=歌曲时间） |
| `tools/check_sync.py` | 客观校验歌词↔音频对齐（谱流量起音 + 掩码相关性） |
| `tools/verify_lyrics.py` | 量成片歌词条的赭石高亮进度，验证逐字填充是否跟着唱 |
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
5. **成片会发灰的真正原因不是场景代码，是色彩范围**。`-pix_fmt yuv420p` 单独写没用，ffmpeg 会照抄 JPEG 的
   full range，输出标成 `yuvj420p(pc)`，播放器/电视上黑位被压、全片发白。必须
   `-vf scale=in_range=pc:out_range=tv` 再打 bt709 标签。校验方法：
   ```bash
   ffmpeg -ss 10 -i out/忘记时间_水彩MV.mp4 -frames:v 1 -vf "signalstats,metadata=print:file=-" -f null - 2>&1 | grep YAVG
   ```
   正确时 YAVG ≈ `16 + 原始帧YAVG × 219/255`（本次：原始 187.7 → 成片 176.8）。
6. `npm install` 会去下 `ffmpeg-static`（80 MB），机器上已有 ffmpeg 就别装了，用 `npm install --omit=dev`。
7. **"歌词对不上声音"是逐字填充的时长算错，不是时间轴错**。原代码给逐字填充加了 `n *.3`（0.3 秒/字）的上限，
   而这首歌慢句每字实际要 0.6–0.8 秒，这个上限比真实演唱快 2–3 倍：27 行里 **22 行**的字在唱完前 **2–5 秒**
   就全部变色了，看起来就是"字幕跑在声音前面"。
   正确做法：`singDur = (b - a) * .85`。因为 LRC 里下一行的起点就是这行唱完的时刻，`(b - a)` 本身就是这句话
   的演唱时长，乘 .85 正好留出换气的尾巴。**别再按字数给上限。**
   校验方法（成片里直接量）：
   ```bash
   python tools/verify_lyrics.py        # 赭石高亮跨度应随时间线性推进，行尾前 15% 才填满
   python tools/check_sync.py           # 行级时间轴：逐行行首偏差中位数应接近 0
   ```
   注意 `check_sync.py` 的行首起音曲线会被鼓点锁住（起伏周期 ≈ 一拍），只能看整体有没有系统性偏移，
   逐行判断要看"最近起音距离"那张表的中位数。
