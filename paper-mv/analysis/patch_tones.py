"""Tonal pass: the layered seas need real separation between sheets."""
import io

p = 'src/shots/Shot01.tsx'
s = io.open(p, encoding='utf-8').read()

old = "    const color = mix(C.sea4, C.sea1, i / 5);"
new = """    // six clearly separated paper tones, light at the back, ink at the front
    const tone = ['#5d93bb', '#48799f', '#35608a', '#254a72', '#16325a', '#0a1730'][i];
    const color = tone;"""
if old not in s:
    print('!! color line not found')
s = s.replace(old, new)

s = s.replace(
    """              <path
                d={l.crest}
                fill="none"
                stroke={mix(C.foam, l.color, 0.35)}
                strokeWidth={9 - l.i * 0.6}
                strokeLinecap="round"
                opacity={0.34 + 0.1 * pulse(g, BEAT, 2)}
              />""",
    """              <path
                d={l.crest}
                fill="none"
                stroke={mix(C.foam, l.color, 0.18)}
                strokeWidth={12 - l.i * 0.9}
                strokeLinecap="round"
                opacity={0.5 + 0.18 * pulse(g, BEAT, 2)}
              />""",
)

io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('shot 1 tones separated')
