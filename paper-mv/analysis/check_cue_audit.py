"""Final cue audit against the SFX-only render: every scheduled cue must produce
energy in the 150 ms after its frame."""
import wave
import numpy as np

w = wave.open('analysis/sfxonly.wav', 'rb')
sr = w.getframerate()
x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
FPS = 30

cues = []
cues += [(0 + i * 18, 'paper_swish') for i in range(6)]
cues += [(102, 'paper_big'), (108, 'splash')]
cues += [(108, 'heartbeat'), (108, 'paper_big')]
cues += [(108 + b * 18, 'lantern_ping') for b in range(4)]
cues += [(117, 'tick'), (135, 'tick'), (153, 'tick')]
cues += [(171, 'glow'), (180, 'bubble_pop'), (198, 'bubble_pop')]
cues += [(222, 'boom'), (222, 'wave_rise'), (243, 'glow'), (252, 'whale'), (261, 'splash'), (279, 'whale')]
cues += [(315 + k * 18, 'crowd') for k in range(5)]
cues += [(315 + k * 18, 'paper_swish') for k in range(6)]
cues += [(414, 'paper_tear'), (414, 'boom'), (414, 'whoosh_push')]
cues += [(519, 'chime_gold')]
cues += [(519 + k * 9, 'lantern_ping') for k in range(9)]
cues += [(606, 'whoosh_push'), (606, 'glow'), (634, 'tick')]
cues += [(672, 'paper_fall'), (690, 'paper_fall'), (690, 'paper_big'), (708, 'paper_fall'), (706, 'lantern_ping')]

print('frame  time    sfx             amp@cue   amp@-0.2s  verdict')
missing = 0
for f, name in sorted(cues):
    t = f / FPS
    a = int(t * sr)
    win = np.abs(x[a:a + int(0.15 * sr)])
    pre = np.abs(x[max(0, a - int(0.2 * sr)):a])
    if len(win) == 0:
        print('%5d  %.3f  %-14s  -- off end' % (f, t, name))
        continue
    m, p = float(win.max()), float(pre.max()) if len(pre) else 0.0
    ok = m > max(0.008, p * 0.9)
    if not ok:
        missing += 1
    print('%5d  %.3f  %-14s  %.4f    %.4f     %s' % (f, t, name, m, p, 'ok' if ok else 'MISSING'))

print('\ncues checked: %d, unresolved: %d' % (len(cues), missing))
