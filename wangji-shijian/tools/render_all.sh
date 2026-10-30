#!/bin/bash
# 分块渲染 SVG->JPG 帧序列。Chrome 渲到一定帧数会崩（Target closed），所以每块重开浏览器，崩了自动重试。
# render.mjs --frames 会跳过已存在的帧，所以随时中断、随时续跑，不会重复劳动。
#
# 用法:   FPS=12 ./tools/render_all.sh
# 要求:   node、Google Chrome；ffmpeg 只在最后 encode.sh 用到
set -u
cd "$(dirname "$0")/.."

# ---- 前置检查 ----
command -v node >/dev/null || { echo "缺少 node。装 Node.js 20+ 后重试。"; exit 1; }
[ -f node_modules/puppeteer-core/package.json ] || { echo "缺少依赖，先跑: npm install   (或 pnpm install)"; exit 1; }

DUR=272.14
CHUNK=${CHUNK:-12}      # 每块几秒
FPS=${FPS:-12}          # 必须是 12：帧文件名对应的时间点由它决定，改了会和已有帧错位
N=23
FAIL=0
for ((i=0;i<N;i++)); do
  S=$((i*CHUNK))
  E=$(( (i+1)*CHUNK )); [ $E -gt 272 ] && E=273
  ok=0
  for try in 1 2 3 4 5 6; do
    echo "=== chunk $S-$E  try $try ==="
    if node render.mjs --frames --range=$S:$E --workers=1 --fps=$FPS; then ok=1; break; fi
    echo "!!! chunk $S-$E failed (try $try), restarting browser"
    sleep 2
  done
  if [ $ok -eq 0 ]; then echo "!!! CHUNK GAVE UP: $S-$E"; FAIL=$((FAIL+1)); fi
done
echo "=== done: $(ls out/frames | wc -l) frames @ ${FPS}fps, $FAIL chunks gave up ==="
