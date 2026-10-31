// Scene05.tsx — 归山 · 13.90–15.00 s. The ink lifts off the type and the seal, leaving a dry ring on the
// paper, and travels back up to the seed dot frame 0 shows. The loop closes on the same mark it opened with.
import React from 'react';
import {Canvas, EASE, InkFilter, mix, prog} from '../lib/motion';
import {COLOR} from '../spec';
import {BEAD, Seal, Wordmark} from '../lib/film';

export const Scene05: React.FC<{t: number}> = ({t}) => {
  if (t < 13.9) return null;
  const ring = prog(t, 13.95, 0.85, EASE.out);
  return (
    <Canvas>
      <Wordmark t={t} />
      <Seal t={t} />
      <InkFilter id="inkDry" edge={4} freq={0.05} grain={0.45} seed={57} />
      {ring > 0 && ring < 1 && (
        <circle cx={BEAD[0]} cy={BEAD[1]} r={mix(46, 176, ring)} fill="none" stroke={COLOR.wash}
          strokeWidth={2.6} opacity={0.16 * (1 - ring) * (1 - ring)} filter="url(#inkDry)" />
      )}
    </Canvas>
  );
};
