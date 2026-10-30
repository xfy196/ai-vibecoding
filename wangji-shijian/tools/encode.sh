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

# 两件必须做的事，否则播放器上会发灰：
#   1) JPEG 帧是 **full range (pc)**，H.264 要 **limited range (tv)**，必须显式转，否则黑位被压、全片发白。
#   2) 1080p 要打上 bt709 色彩标签，否则很多播放器按 bt601 解，颜色会偏。
"$FF" -y -loglevel error -framerate 12 -i out/frames/f%05d.jpg -i assets/song.mp3 \
  -map 0:v -map 1:a \
  -vf "scale=in_range=pc:out_range=tv:flags=lanczos,format=yuv420p" \
  -c:v libx264 -preset slow -crf 20 -r 24 \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -c:a aac -b:a 192k -shortest -movflags +faststart \
  "out/忘记时间_水彩MV.mp4"
ls -lh "out/忘记时间_水彩MV.mp4"
"$FF" -i "out/忘记时间_水彩MV.mp4" 2>&1 | grep -E "Duration|Stream" || true
