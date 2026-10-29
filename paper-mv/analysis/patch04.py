import io

p = 'src/shots/Shot04.tsx'
s = io.open(p, encoding='utf-8').read()
s = s.replace('  void foamWave;\n', '')
old = """              d={crestPath({
                y: 536,
                amp: 200,
                wavelength: 1650,
                phase: 1.15 + g * 0.02,
                jag: 5,
                seed: 92,
                step: 22,
                tilt: -300,
              })}"""
s = s.replace(old, "              d={foamWave}")
s = s.replace(
    "import { blob, wavePath } from '../paper/paths';",
    "import { blob, crestPath, wavePath } from '../paper/paths';",
)
io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('foamWave uses:', s.count('foamWave'), 'crestPath uses:', s.count('crestPath'))
