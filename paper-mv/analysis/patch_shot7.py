"""Shot 7: the lanterns must pop against a deeper dawn sky."""
import io

p = 'src/shots/Shot07.tsx'
s = io.open(p, encoding='utf-8').read()

pairs = [
    ('<stop offset="0%" stopColor="#3d1b26" />', '<stop offset="0%" stopColor="#24101c" />'),
    ('<stop offset="26%" stopColor="#9c4a2c" />', '<stop offset="26%" stopColor="#6b2a1f" />'),
    ('<stop offset="52%" stopColor="#ffb44a" />', '<stop offset="52%" stopColor="#c9551f" />'),
    ('<stop offset="76%" stopColor={C.gold} />', '<stop offset="76%" stopColor="#f6a13a" />'),
    ('<stop offset="100%" stopColor={C.gold2} />', '<stop offset="100%" stopColor="#ffd489" />'),
    # lanterns: near-white paper, so they are bright dots on the deep sky
    ('fill={mix(C.gold2, C.paper, 0.15 + 0.05 * (l.k % 3))}', 'fill={mix(C.paper, C.gold2, 0.22 + 0.1 * (l.k % 3))}'),
    ('fill={mix(C.gold, C.gold2, 0.6)}', 'fill={mix(C.gold2, C.paper, 0.45)}'),
    # the warm haze should not wash the top of the frame
    ("<rect width={W} height={H} fill=\"url(#s7warm)\" opacity={0.6 + 0.15 * glowPulse} />",
     "<rect y={220} width={W} height={H - 220} fill=\"url(#s7warm)\" opacity={0.55 + 0.15 * glowPulse} />"),
]
for old, new in pairs:
    if old not in s:
        print('!! NOT FOUND:', old[:60])
    s = s.replace(old, new)
io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('shot 7 sky deepened')
