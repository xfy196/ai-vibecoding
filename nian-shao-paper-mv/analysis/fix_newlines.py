import io
import sys

p = 'src/NianShaoMV.tsx'
s = io.open(p, encoding='utf-8-sig').read().replace('\\n', '\n')
io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
sys.stdout.reconfigure(encoding='utf-8')
print(s)
