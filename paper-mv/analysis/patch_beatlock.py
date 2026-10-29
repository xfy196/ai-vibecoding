"""Beat-lock pass: every shot gets a tiny camera thump on the beat, and the
pier crowd now clearly swaps a batch per beat."""
import io

THUMP = ' * (1 + 0.0065 * pulse(g, BEAT, 3))'

edits = {
    'src/shots/Shot01.tsx': [
        ('<Camera scale={camPush} x={-12 * ramp(g, t0, t0 + 108)} y={0}>',
         '<Camera scale={camPush' + THUMP + '} x={-12 * ramp(g, t0, t0 + 108)} y={0}>'),
    ],
    'src/shots/Shot02.tsx': [
        ('<Camera scale={camScale} y={camY} x={0}>',
         '<Camera scale={camScale' + THUMP + '} y={camY} x={0}>'),
    ],
    'src/shots/Shot03.tsx': [
        ('<Camera scale={1.02 + warmth * 0.04} x={0} y={warmth * -8}>',
         '<Camera scale={(1.02 + warmth * 0.04)' + THUMP + '} x={0} y={warmth * -8}>'),
    ],
    'src/shots/Shot04.tsx': [
        ('<Camera scale={camScale} x={shakeX} y={shakeY}>',
         '<Camera scale={camScale' + THUMP + '} x={shakeX} y={shakeY}>'),
    ],
    'src/shots/Shot05.tsx': [
        ('<Camera scale={1.01 + ramp(lf, 0, 102, 0, 0.035)} x={ramp(lf, 0, 102, -14, 14)}>',
         '<Camera scale={(1.01 + ramp(lf, 0, 102, 0, 0.035))' + THUMP + '} x={ramp(lf, 0, 102, -14, 14)}>'),
        # a clearer batch swap: bigger step + a short flash as the new batch lands
        ("const snap = beat * 26 + (1 - beatPulse) * 0.0; // stop-motion step on every beat",
         "const snap = beat * 58; // stop-motion step: the whole batch jumps on every beat\n  const batchFlash = ramp(lf % BEAT, 0, 5, 0.35, 1);"),
        ("                  opacity={0.96}",
         "                  opacity={0.96 * batchFlash}"),
    ],
    'src/shots/Shot06.tsx': [
        ('<Camera scale={1.0 - drift * 0.03}>',
         '<Camera scale={(1.0 - drift * 0.03)' + THUMP + '}>'),
    ],
    'src/shots/Shot07.tsx': [
        ('<Camera scale={zoom} y={tilt}>',
         '<Camera scale={zoom' + THUMP + '} y={tilt}>'),
    ],
    'src/shots/Shot09.tsx': [
        ('<Camera scale={1 + sail * 0.04}>',
         '<Camera scale={(1 + sail * 0.04)' + THUMP + '}>'),
        ("import { ramp, springIn } from '../anim';", "import { pulse, ramp, springIn } from '../anim';"),
    ],
}

for path, pairs in edits.items():
    s = io.open(path, encoding='utf-8').read()
    for old, new in pairs:
        if old not in s:
            print('!! NOT FOUND in %s: %s' % (path, old[:70]))
        s = s.replace(old, new)
    io.open(path, 'w', encoding='utf-8', newline='\n').write(s)
    print('patched', path)
