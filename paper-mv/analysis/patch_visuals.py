import io

def patch(p, pairs, note):
    s = io.open(p, encoding='utf-8').read()
    for old, new in pairs:
        if old not in s:
            print('!! NOT FOUND in %s: %r' % (p, old[:60]))
        s = s.replace(old, new)
    io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
    print('patched', p, '-', note)


# --- 05: the water behind the pier must fill downwards, not upwards
patch('src/shots/Shot05.tsx', [
    ("d={wavePath({ y: 660, amp: 8, wavelength: 900, phase: g * 0.03, jag: 3, seed: 41, bottom: 420, step: 40 })}",
     "d={wavePath({ y: 664, amp: 12, wavelength: 760, phase: g * 0.03, jag: 3.5, seed: 41, bottom: 800, step: 30 })}"),
], 'sea band fills down to the pier')

# --- 07: the near ridge was filling upwards and flattening the whole frame
patch('src/shots/Shot07.tsx', [
    ("d={wavePath({ y: 985, amp: 22, wavelength: 1400, phase: g * 0.02, jag: 4, seed: 803, bottom: 420, step: 36 })}",
     "d={wavePath({ y: 972, amp: 26, wavelength: 1100, phase: g * 0.02, jag: 5, seed: 803, bottom: 1240, step: 30 })}"),
    # brighter, warmer sky so the golden section actually reads golden
    ('<stop offset="0%" stopColor="#2a1526" />', '<stop offset="0%" stopColor="#3d1b26" />'),
    ('<stop offset="26%" stopColor="#7a3a2c" />', '<stop offset="26%" stopColor="#9c4a2c" />'),
    ('<stop offset="52%" stopColor={C.gold3} />', '<stop offset="52%" stopColor="#ffb44a" />'),
], 'near ridge down + warmer sky')

# --- 09: let the seas linger a little instead of dropping off screen
patch('src/shots/Shot09.tsx', [
    ("y: 620 + i * 116 + drop * 330,", "y: 620 + i * 108 + drop * 210,"),
    ("opacity: 1 - drop * 0.35,", "opacity: 1 - drop * 0.25,"),
], 'gentler falling layers')

# --- 03: give the silhouette a paper rim light so the close-up reads
patch('src/shots/Shot03.tsx', [
    ("""          <g transform="translate(560 1400) scale(5.2)">
            <Boy x={0} y={0} scale={1} fill={mix(C.ink, '#2a1526', warmth * 0.9)} lanternGlow={0.5 + 0.5 * lanternPulse} />
          </g>""",
     """          <g transform="translate(560 1400) scale(5.2)">
            {/* a second, lighter sheet peeking out behind = paper rim light */}
            <g transform="translate(7 -6)" opacity={0.55 + warmth * 0.3}>
              <Boy x={0} y={0} scale={1.012} fill={mix('#2b4a7a', '#c98a54', warmth)} lanternGlow={0} />
            </g>
            <Boy x={0} y={0} scale={1} fill={mix(C.ink, '#2a1526', warmth * 0.9)} lanternGlow={0.45 + 0.4 * lanternPulse} />
          </g>"""),
], 'rim light on the close-up')
