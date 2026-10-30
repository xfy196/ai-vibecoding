#!/bin/bash
# 把 out/frames 的 12fps 帧序列编成 MP4 并混入歌曲。
# -framerate 12 输入 + -r 24 输出：每张画面重复一次，得到 24fps 容器里的"一拍二"手绘节奏，播放器兼容性最好。
set -eu
cd "$(dirname "$0")/.."

FF=$(command -v ffmpeg || true)
[ -z "$FF" ] && [ -x ./bin/ffmpeg ] && FF=./bin/ffmpeg
[ -z "$FF" ] && { echo "缺少 ffmpeg。装一个：brew install ffmpeg / npm i -D ffmpeg-static"; exit 1; }

N=$(ls out/frames/*.jpg 2>/dev/null | wc -l | tr -d ' ')
[ "$N" -eq 0 ] && { echo "out/frames 里没有帧，先跑 tools/render_all.sh"; exit 1; }
echo "encoding $N frames @12fps -> 24fps container using $FF"

"$FF" -y -loglevel error -framerate 12 -i out/frames/f%05d.jpg -i assets/song.mp3 \
  -map 0:v -map 1:a -c:v libx264 -preset slow -crf 22 -pix_fmt yuv420p -r 24 \
  -c:a aac -b:a 192k -shortest -movflags +faststart \
  "out/忘记时间_水彩MV.mp4"
ls -lh "out/忘记时间_水彩MV.mp4"
"$FF" -i "out/忘记时间_水彩MV.mp4" 2>&1 | grep -E "Duration|Stream" || true
