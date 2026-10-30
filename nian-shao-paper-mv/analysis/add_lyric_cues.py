"""Emit the lyric-typing SFX cues into src/cues.ts (numbers only, so the Python
mixer parses exactly the same sheet)."""
import io
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

theme = io.open('src/theme.ts', encoding='utf-8-sig').read()
times = [float(m.group(1)) for m in re.finditer(r"\{ at: ([0-9.]+), text:", theme)]
print('lyric lines:', len(times))

body = '\n'.join(f"  a({t}, 'paper_swish', 0.05)," for t in times)
block = (
    "// 歌词上屏：每句都有一声极轻的纸响（纸条被按在桌上）\n"
    "const lyricCues: Cue[] = [\n" + body + "\n];\n\n"
)

p = 'src/cues.ts'
src = io.open(p, encoding='utf-8-sig').read()
start = src.index('// 歌词上屏')
end = src.index('export const CUES: Cue[] =')
src = src[:start] + block + src[end:]
src = src.replace(
    'export const CUES: Cue[] = [...base, ...shot1',
    'export const CUES: Cue[] = [\n  ...base,\n  ...lyricCues,\n  ...shot1',
)
io.open(p, 'w', encoding='utf-8', newline='\n').write(src)
print('patched', p)
