"""Brighten the climax (shot 4) and give the hit a flash frame."""
import io

p = 'src/shots/Shot04.tsx'
s = io.open(p, encoding='utf-8').read()

pairs = [
    # wave body: lighter, more electric
    ("<Paper d={baseWave} fill={mix(C.sea3, C.teal, 0.55)} shadow=\"soft\" edge={light(C.sea3, 0.3)} tex={0.6} />",
     "<Paper d={baseWave} fill={mix(C.sea4, C.teal2, 0.35)} shadow=\"soft\" edge={light(C.sea4, 0.35)} tex={0.6} />"),
    # sky: lift the horizon
    ('<stop offset="72%" stopColor="#123a63" />', '<stop offset="72%" stopColor="#1c5285" />'),
    ('<stop offset="100%" stopColor="#0a1a33" />', '<stop offset="100%" stopColor="#123356" />'),
    # far sea lighter
    ("fill={mix(C.sea1, C.ink, 0.2)}", "fill={mix(C.sea2, C.ink, 0.05)}"),
    # whale reads as paper white on the dark sea
    ("fill={mix(C.whale, C.teal2, 0.35)}", "fill={mix(C.whale2, C.sea4, 0.3)}"),
    ("fill2={mix(C.whale2, C.foam, 0.3)}", "fill2={mix(C.foam, C.sea4, 0.25)}"),
    # moonlit burst behind the crest, plus a moonlit horizon line
    ("""          {/* the towering wave: body, foam lip, spray */}
          <g transform="translate(0 0)">""",
     """          {/* moonlight burning through the wave */}
          <circle cx={780} cy={470} r={620} fill="url(#glMoon)" opacity={0.3 + 0.25 * pulse(g, BEAT, 2)} />
          <path
            d={`M -60 806 q 500 -26 2040 0`}
            stroke={C.foam}
            strokeWidth={6}
            fill="none"
            opacity={0.35}
          />

          {/* the towering wave: body, foam lip, spray */}
          <g transform="translate(0 0)">"""),
    # impact flash on the downbeat
    ("""          <Vignette opacity={0.85} />""",
     """          <rect
            width={W}
            height={H}
            fill={C.foam}
            opacity={0.55 * (1 - ramp(lf, 0, 5))}
            style={{ mixBlendMode: 'screen' }}
          />
          <Vignette opacity={0.85} />"""),
]

for old, new in pairs:
    if old not in s:
        print('!! NOT FOUND:', old[:70])
    s = s.replace(old, new)

io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('shot 4 brightened')
