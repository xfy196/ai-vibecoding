#!/bin/bash
# 分块渲染：Chrome 渲到一定帧数会崩（Target closed），所以每块重开一个浏览器，崩了就重试。
# render.mjs --frames 会跳过已存在的帧，所以重跑不会浪费。
set -u
cd "$(dirname "$0")/.."
export PATH="$PWD/bin:/Users/xufuying/.dsh-beta/dsh-runtimes/dsh-next-primary-runtime/dependencies/node/bin:$PATH"
DUR=272.14
CHUNK=12          # 每块几秒
FPS=${FPS:-12}
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
