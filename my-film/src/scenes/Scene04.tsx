// Scene04.tsx — 题名 · 10.60–13.90 s. The bead spreads and prints 青山; the seal is stamped at 12.50 s
// and the name is held for the length of its reading.
import React from 'react';
import {Canvas} from '../lib/motion';
import {Seal, Wordmark} from '../lib/film';

export const Scene04: React.FC<{t: number}> = ({t}) => {
  if (t < 10.6 || t >= 13.9) return null;
  return (
    <Canvas>
      <Wordmark t={t} />
      <Seal t={t} />
    </Canvas>
  );
};
