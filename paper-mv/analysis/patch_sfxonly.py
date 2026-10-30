import io

# 1) PaperMV: expose the cue table + an SFX-only composition for QA
p = 'src/PaperMV.tsx'
s = io.open(p, encoding='utf-8').read()
s = s.replace(
    "interface Cue {",
    "export interface Cue {",
)
s = s.replace(
    "const CUES: Cue[] = [",
    "export const CUES: Cue[] = [",
)
s = s.replace(
    "const Sfx: React.FC<{ ctx: Cue }> = ({ ctx }) => (",
    "export const Sfx: React.FC<{ ctx: Cue }> = ({ ctx }) => (",
)
s += """
/**
 * QA-only composition: the sound effects on their own, no music bed. Used to
 * verify frame-accurate cue placement without the bed masking everything.
 */
export const SfxOnly: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: '#101820' }}>
    {CUES.filter((c) => c.at < DURATION_IN_FRAMES).map((c, i) => (
      <Sfx key={i} ctx={c} />
    ))}
  </AbsoluteFill>
);
"""
io.open(p, 'w', encoding='utf-8', newline='\n').write(s)

p = 'src/Root.tsx'
s = io.open(p, encoding='utf-8').read()
s = s.replace(
    "import { PaperMV } from './PaperMV';",
    "import { PaperMV, SfxOnly } from './PaperMV';",
)
s = s.replace(
    """    />
  </>
);""",
    """    />
    <Composition
      id="SfxOnly"
      component={SfxOnly}
      durationInFrames={DURATION_IN_FRAMES}
      fps={FPS}
      width={W}
      height={H}
    />
  </>
);""",
)
io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('SfxOnly composition added')
