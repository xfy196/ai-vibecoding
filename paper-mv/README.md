# 层叠剪纸 · 动效 MV（Remotion）

24.1 秒、9 个镜头的层叠剪纸风格 MV。画面 100% 由 React + SVG 逐帧生成，
没有一个外部图片素材；纸张纤维、纹理贴图用 `numpy` 现算，音效与配乐用
`numpy` 从正弦波和噪声合成。

## 一、先说音频这件事（重要）

`133adc949a332323bac8d9e6b6e5e2e5f6cb0f2b.mp4` 的音轨是**损坏的**：
容器里写着 4:32，但 AAC 码流除前 ~10.3 秒外全部无法解码（ffmpeg 报
`Prediction is not allowed in AAC-LC` / `channel element ... is not allocated`，
只能解出 10.3 秒有效音频）。所以拿不到可用的 BGM。

因此本项目按你的分镜表（0–24.1s）做，音轨用的是**程序合成的 100 BPM 配乐床 +
全套音效**，卡点全部对在这条合成轨道上：

* 画面切点严格等于分镜表给出的秒数（30fps 下逐帧精确：108 / 171 / 222 / 312 /
  414 / 519 / 606 / 672 帧）。
* `assets/gen_audio.py` 在每一个切点上都放了一个 kick 重音 + 反向气声，所以
  9 个切点在有声音时也全部是"重拍落点"。
* 想换回真歌：把 24.1 秒的可用音频放到 `public/music/bed.mp3`（或改
  `src/PaperMV.tsx` 里那一条 `<Audio>` 的 `src`），重渲一次即可，其他都不用动。

## 二、目录

```
src/
  index.ts / Root.tsx        入口与 Composition（1920×1080 / 30fps / 723 帧）
  theme.ts                   画布常量、调色板、颜色混合工具、9 个切点
  anim.ts                    pulse / springIn / ramp 等卡点工具
  paper/paths.ts             全部纸形都是这里算出来的（撕边浪、云、鲸、灯、星芒…）
  paper/Paper.tsx            剪纸图元：纸色 + 纤维 + 硬边投影 + 颗粒/暗角/虚拟相机
  paper/figures.tsx          纸偶：月亮、纸船、男孩、女孩、鲸鱼、孔明灯、路人、眼睛
  shots/Shot01..09.tsx       9 个镜头，各一套构图
  PaperMV.tsx                时间轴：9 个 Sequence + 音效 cue 表
assets/
  gen_textures.py            生成 public/tex/*.png（可无缝平铺的纸纤维/颗粒）
  gen_audio.py               生成 public/sfx/*.wav 与 public/music/bed.wav
analysis/                    分析脚本（节拍拟合、电平校验、渲染数值校验）
```

## 三、卡点与镜头表

100 BPM → 1 拍 = 0.6s = 18 帧（整数，逐帧对齐）。

| 镜头 | 时间 | 帧 | 画面 | 卡点实现 |
|---|---|---|---|---|
| ① 启航 | 0–3.6s | 0–108 | 大月亮、6 层纸浪、第 7 拍纸船冒头、男孩提灯 | 每拍升一层（`springIn` 起点 = i×18 帧）|
| ② 孤夜 | 3.6–5.7s | 108–171 | 拉远、乌云吞月、深海里只剩一点灯笼光 | 灯笼每拍亮（`pulse`），星星半拍眨 |
| ③ 想着你 | 5.7–7.4s | 171–222 | 男孩特写 + 念想泡泡，冷色转暖 | 泡泡每拍变大（3 段 spring） |
| ④ 不惶恐 | 7.4–10.4s | 222–312 | 巨浪立起、船爬上浪尖、纸鲸跃出、月亮回来 | 切点即重拍：白闪 + 震屏 + 鲸鱼起跳 |
| ⑤ 人来人往 | 10.4–13.8s | 312–414 | 粉色黄昏码头，四层路人交错 | 每拍整批位移 58px + 落位闪 |
| ⑥ 离开 | 13.8–17.3s | 414–519 | 码头与船两张纸像幕布一样撕开 | `springIn` 撕开量 6→250px，差速漂移 |
| ⑦ 感谢 | 17.3–20.2s | 519–606 | 满天台孔明灯升起，镜头上摇 | 每半拍点一盏（9 帧），`tilt` 70→-150 |
| ⑧ 你眼中 | 20.2–22.4s | 606–672 | 月亮变成她眼里的倒影，推进去是两人坐船 | 睁眼 9 帧，推镜 1→4.55× 从重拍开始 |
| ⑨ 尾声 | 22.4–24.1s | 672–723 | 纸浪一层层落下，船驶进月亮，淡出 | 每拍落一层，最后 13 帧化黑 |

## 四、渲染

```powershell
cd D:\porojects\ai-vibecoding\paper-mv
npx remotion render PaperMV out\paper-mv.mp4 `
  --browser-executable "C:\Users\Administrator\AppData\Local\Google\Chrome\Application\chrome.exe"
```

**必须带 `--browser-executable`**：Remotion 自带的 Chrome Headless Shell 在这台机器上
下载不下来（storage.googleapis.com 卡住），改用本机 Chrome 156 渲染。
临时目录也建议指到工作区内，否则 ffmpeg 写 %TEMP% 会被拒：

```powershell
$env:TEMP='D:\porojects\ai-vibecoding\paper-mv\.tmp'; $env:TMP=$env:TEMP
```

预览（快 8 倍，480×270）：

```powershell
npx remotion render PaperMV out\preview.mp4 --scale=0.25 --concurrency=8 --browser-executable "<chrome路径>"
```

重新生成素材：

```powershell
python assets\gen_textures.py
python assets\gen_audio.py
```

## 五、性能笔记

第一版每个纸片都叠了 `feDropShadow` + `soft-light` 造纸纹，1080p 下单帧渲染
直接爆掉（一个 still 20 分钟没出来）。改成：

* 投影 = 复制一份轮廓填近黑色、向下偏移（纸雕灯箱的硬光感，也更像剪纸）；
* 纸纹 = 每片一次静态 `url(#fiber)` 叠加，取消逐片混合模式；
* 全局只保留一层颗粒 + 一层灰尘的混合。

改完单帧约 0.1 秒，整片 1080p 渲染 ~5 分钟。

## 六、数值校验（无显示器时的自检）

`analysis/` 里几个脚本用来在没有肉眼看片的情况下验证结果：

* `tempo_fit.py` — 用给定切点反解节拍网格（最优 140 BPM，但分镜表里"6 层浪/3.6s"
  只有 100 BPM 能整除，故取 100 BPM）。
* `qa_audio.py` — 配乐床电平曲线与 9 个切点的瞬态检查。
* `verify_video.py` — 从成片里量出"帧间差最大的位置"是否正好是 9 个切点、每个
  镜头的平均色/亮度。
* `analyze_beats.py` — 逐拍运动能量，确认"每拍一层 / 每拍一批人"确实踩在拍上。
* `analyze_stills.py` — 把静帧读成亮度字符画 + 主色板，用于检查构图有没有塌。
