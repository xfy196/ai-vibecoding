"""Two cues sat 3 frames late. Snapping them onto the exact cut frames."""
import io

p = 'src/PaperMV.tsx'
s = io.open(p, encoding='utf-8').read()

pairs = [
    # shot 4 starts at 10.4 s = frame 222; 12.5 beats would be 7.6 s
    ("{ at: 12.5 * BEAT, sfx: 'boom', volume: 0.55 },", "{ at: 222, sfx: 'boom', volume: 0.55 },"),
    ("{ at: 12.5 * BEAT, sfx: 'wave_rise', volume: 0.4 },", "{ at: 222, sfx: 'wave_rise', volume: 0.4 },"),
    # shot 7 starts at 17.3 s = frame 519
    ("{ at: 28.83 * BEAT + 1, sfx: 'chime_gold', volume: 0.36 },", "{ at: 519, sfx: 'chime_gold', volume: 0.36 },"),
    ("    at: 28.83 * BEAT + 1 + k * (BEAT / 2),", "    at: 519 + k * (BEAT / 2),"),
]
for old, new in pairs:
    if old not in s:
        print('!! NOT FOUND:', old[:60])
    s = s.replace(old, new)
io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('cue times snapped to cut frames')
