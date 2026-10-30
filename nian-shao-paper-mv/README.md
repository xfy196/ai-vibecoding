# 年少有为 · 层叠剪纸 MV

李荣浩《年少有为》4′39″ 的动效 MV：**全部画面与全部音效都由代码生成**（Remotion + React + SVG，音效用 numpy 合成），没有一张照片、没有一个采样素材。

- 分辨率 1920×1080 · 30 fps · 8374 帧（279.147 s，与 BGM 逐帧对齐）
- 9 个镜头，9 种互不重复的构图
- 43 行歌词以剪纸字形逐行上屏（时间轴取自 .lrc）
- 声音 = 原曲 + 30 余种程序化音效（纸滑、撕纸、压印、碰杯、雨、雷、人声底噪……）

镜头脚本（先于代码完成）：[`docs/shot-script.md`](docs/shot-script.md)

## 快速开始

```bash
npm install

# 预览（Remotion Studio）
npm run dev

# 抽一张静帧看看
npx remotion still NianShaoMV out/stills/f1000.png --frame=1000
```

## 成片是怎么出来的

Remotion 自带的 ffmpeg 管道在这台机器上会以 `write EOF` 中断，所以成片分三步做：

```bash
# 1) 画面：PNG 序列（不经 Remotion 的 muxer，约 15 分钟 / 8374 帧）
npx remotion render NianShaoMV out/frames --sequence --image-format=png --concurrency=6

# 2) 声音：numpy 把原曲与全部音效混在一起（cue 表从 src/cues.ts 解析）
python assets/mix_audio.py            # -> out/audio/mix.wav

# 3) 合流：ffmpeg 编码 H.264 + AAC
python assets/encode.py               # -> out/nian-shao-paper-mv.mp4
```

成片：`out/nian-shao-paper-mv.mp4` — 1920×1080 / 30 fps / 8374 帧 / 4′39″ / H.264 CRF 17 + AAC 256k。
同一份 cue 表同时驱动预览用的 `<Audio>` 和成片用的 `mix_audio.py`，音画不会漂移。

> **浏览器**：Remotion 会从 `storage.googleapis.com` 下载 Chrome Headless Shell，本机访问不到。
> 已从 npmmirror 的 chrome-for-testing 镜像取同一版本解包到
> `node_modules/.remotion/chrome-headless-shell/`，`remotion.config.ts` 里用
> `Config.setBrowserExecutable()` 指向它。换机器时如遇同样问题：
> ```bash
> curl -L -o chs.zip https://cdn.npmmirror.com/binaries/chrome-for-testing/157.0.8080.0/win64/chrome-headless-shell-win64.zip
> ```

## 重新生成素材 / QA

```bash
python assets/gen_textures.py   # 纸纹（颗粒/纤维/斑块/纸屑/划痕）
python assets/gen_audio.py      # 32 个音效 -> public/sfx/*.wav
python assets/analyze_song.py   # 测 BPM（66.3）与响度曲线 -> analysis/song.json
python analysis/qa_stills.py out/stills/*.png   # 静帧文字化 QA（亮度/色彩/ASCII 缩略图）
python analysis/qa_motion.py                    # 全片抽帧：切点是否准、哪段太静、亮度曲线
```

## 目录

```
src/
  theme.ts          时间轴（9 个镜头的帧边界）、歌词时间戳、调色板、颜色工具
  anim.ts           缓动、节拍脉冲、弹簧、确定性噪声
  cues.ts           音效 cue sheet（每一处纸的动作对应一个声音）
  NianShaoMV.tsx    9 个 Sequence + 原曲 + 音效
  paper/
    Paper.tsx       <Paper> 纸层原语、<Camera>、纸颗粒、暗角
    edges.ts        撕边 / 锯齿 / 花边 / 月牙纹 / 裂纹 / 纸屑 路径生成器
    figures.tsx     人形、酒器、碗、手机、孔明灯、铜钱、囍字、桌椅……
  shots/Shot01..09  九个镜头
assets/             素材生成脚本（纹理 / 音效 / 分析）
docs/shot-script.md 镜头脚本
analysis/           歌曲分析 + 静帧 QA
public/             纸纹、音效、原曲
out/                渲染输出
```

## 九个镜头

| # | 时码 | 构图 | 纸上的动作 |
|---|---|---|---|
| ① | 0:00 | 窗阵隧道（一点透视向心推） | 片名纸板压入，窗格逐层亮灯，最深处电视闪白 |
| ② | 0:30 | 俯视平铺（桌面 90°） | 通讯录纸带翻出、合影沿对角线撕开、钞票数到第七张 |
| ③ | 1:00 | 左右对开（竖切双联） | 中缝撕开、纸月亮升起、红纸盖住下半 |
| ④ | 1:26 | 仰视塔群（虫视上摇） | 楼群立起、向心倾斜、囍字从天而降 |
| ⑤ | 1:57 | 雨窗微距（横向平移） | 雨纸竖条滑落、人影走过玻璃、路灯光斑眨眼 |
| ⑥ | 2:25 | 房屋剖面（横移穿房） | 一室一灯亮、墙裂、"家"字脱落 |
| ⑦ | 3:08 | 极低地平线（仰拍上升） | 孔明灯逐盏升空，一盏在空中翻开露出窗 |
| ⑧ | 3:43 | 前景巨物（纵深宴会厅） | 举杯、钱币雨、红纸压下 |
| ⑨ | 4:14 | 极简留白（拉远） | 拉远成"一张纸"、朱红印章砸下、纸被掀走 |
