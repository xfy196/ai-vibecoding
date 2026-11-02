# 立体书纸艺 MV 工程

一本摊在课桌上的立体书，剪纸叠层 + 水彩纸纹，每句歌词一个书页弹起的纸艺桥段。

- 画布 1920×1080 / 30fps，时长由 `data/spec.json` 的 `duration` 决定
- 单帧确定性绘制（`window.renderFrame(t)`），puppeteer-core 无头 Chrome 逐帧截图，ffmpeg 合原曲

## 命令

```bash
npm install

node scripts/analyze.mjs <audio.mp3> --duration=70   # 出 BPM / 首拍 / 能量低谷 → audio/analysis.json
node scripts/render.mjs --stills 4.5 16.5 30         # 关键帧预检 → out/stills/
node scripts/render.mjs                              # 全片 → out/frames/
node scripts/render.mjs --from=1200 --to=1390        # 局部补帧
node scripts/mux.mjs <audio.mp3> --fade=1.0          # 出片 → out/
```

环境要求：Node ≥18、本机 Chrome/Chromium/Edge、ffmpeg（缺则 `brew install ffmpeg`，或 `npm i ffmpeg-static`，或用 `FFMPEG=/path/to/ffmpeg`）。

## 改片子只动这几个文件

| 要改什么 | 改哪里 |
| --- | --- |
| 时长、节拍、歌词、分镜排布 | `data/spec.json` |
| 某场戏的画法 | `public/js/scenes.js` / `scenes2.js` 对应函数 |
| 纸的质感、人物、道具 | `public/js/props.js` |
| 书、镜头、歌词盖章、翻页、合书 | `public/js/core.js` |

改 `props.js` / `core.js` 会影响全片，必须整片重渲；只改分镜时间可以局部补帧。
