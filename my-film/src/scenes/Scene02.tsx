// Scene02.tsx — 成山 · 3.20–7.00 s. Each ridge is traced along its crest as it blooms, and the near
// ridge's crest is then painted into the dry brush stroke that Scene03 will lift.
import React from 'react';
import {Canvas, EASE, prog, toPath, drawOn} from '../lib/motion';
import {COLOR} from '../spec';
import {Crest, MIDR, NEAR, N} from '../lib/film';

const trace = (pts: [number, number][]) => toPath(pts.filter((_, i) => i % 3 === 0), false);

export const Scene02: React.FC<{t: number}> = ({t}) => {
  if (t < 3.2 || t >= 7.0) return null;
  const midD = trace(MIDR.slice(0, N / 2)), nearD = trace(NEAR.slice(0, N / 2));
  const midP = prog(t, 4.7, 0.9, EASE.inOut);
  const nearP = prog(t, 5.6, 0.85, EASE.inOut);
  const fade = 1 - prog(t, 6.4, 0.55, EASE.smooth);
  return (
    <Canvas>
      {midP > 0 && fade > 0 && (
        <path d={midD} stroke={COLOR.wash} strokeWidth={3} fill="none" opacity={0.3 * fade} strokeLinecap="round" {...drawOn(midD, midP)} />
      )}
      {nearP > 0 && fade > 0 && (
        <path d={nearD} stroke={COLOR.wash} strokeWidth={4} fill="none" opacity={0.42 * fade} strokeLinecap="round" {...drawOn(nearD, nearP)} />
      )}
      <Crest t={t} />
    </Canvas>
  );
};
