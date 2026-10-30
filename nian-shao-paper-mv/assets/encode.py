"""Encode the rendered PNG sequence + the numpy audio mix into the final MP4.

    python assets/encode.py

Reads  out/frames/element-%04d.png   (Remotion `--sequence`)
       out/mix.wav                   (assets/mix_audio.py)
Writes out/nian-shao-paper-mv.mp4    (H.264 CRF 17, AAC 256k, faststart)
"""
import os
import subprocess

FPS = 30
FRAMES = 8374
OUT = os.path.join('out', 'nian-shao-paper-mv.mp4')


def main():
    n = len([f for f in os.listdir('out/frames') if f.endswith('.png')])
    print('frames on disk:', n, '(expected', FRAMES, ')')
    cmd = [
        'ffmpeg', '-y', '-v', 'warning', '-stats',
        '-framerate', str(FPS), '-start_number', '0',
        '-i', os.path.join('out', 'frames', 'element-%04d.png'),
        '-i', os.path.join('out', 'mix.wav'),
        '-c:v', 'libx264', '-preset', 'slow', '-crf', '17',
        '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.1',
        '-c:a', 'aac', '-b:a', '256k', '-ar', '44100',
        '-shortest', '-movflags', '+faststart',
        '-metadata', 'title=年少有为 · 层叠剪纸 MV',
        OUT,
    ]
    print(' '.join(cmd))
    subprocess.run(cmd, check=True)
    print('wrote', OUT, os.path.getsize(OUT) / 1e6, 'MB')


if __name__ == '__main__':
    main()
