// Scene03.tsx — 一叶 · 7.00–10.60 s. The painted crest lifts off the ridge, becomes a leaf, drifts,
// and is drawn into the bead on the title. One object through all of it (E06).
import React from 'react';
import {Canvas} from '../lib/motion';
import {Crest} from '../lib/film';

export const Scene03: React.FC<{t: number}> = ({t}) => {
  if (t < 7.0 || t >= 10.6) return null;
  return (
    <Canvas>
      <Crest t={t} />
    </Canvas>
  );
};
