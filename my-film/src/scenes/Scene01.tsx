// Scene01.tsx — 落墨 · 0.00–2.70 s. The seed dot falls, hits the paper, and the mark it leaves
// is the ring and the spatter; the ink itself is persistent and lives in Film.tsx.
import React from 'react';
import {Canvas, EASE, mix, prog} from '../lib/motion';
import {COLOR, LAND, SEED} from '../spec';

// S17* five droplets thrown by the landing, at the distances the impact would carry them
const SPLAT: {dx: number; dy: number; r: number}[] = [
  {dx: -172, dy: -22, r: 4.4}, {dx: -98, dy: 40, r: 3.1}, {dx: 78, dy: -44, r: 3.8},
  {dx: 152, dy: 24, r: 2.7}, {dx: 36, dy: 54, r: 2.3},
];

export const Scene01: React.FC<{t: number}> = ({t}) => {
  if (t >= 2.7) return null;
  const fall = prog(t, 0.15, 0.85, EASE.in);
  const dropY = mix(SEED[1], LAND[1], fall);
  const falling = t > 0.14 && t < 1.02;
  const ring = prog(t, 1.0, 1.15, EASE.out);
  const ring2 = prog(t, 1.13, 1.2, EASE.out);
  const hit = prog(t, 1.0, 0.42, EASE.out);
  const soak = 1 - prog(t, 2.0, 0.62, EASE.smooth);
  return (
    <Canvas>
      {/* the thread the drop leaves on the paper as it falls */}
      {falling && (
        <path
          d={`M${SEED[0] - 1.6} ${SEED[1] + 30} L${SEED[0] - 1.1} ${dropY - 30} L${SEED[0] + 1.1} ${dropY - 30} L${SEED[0] + 1.6} ${SEED[1] + 30} Z`}
          fill={COLOR.wash} opacity={0.2 * Math.min(1, fall * 5)}
        />
      )}
      {/* two rings on the paper, the second a beat behind */}
      {ring > 0 && ring < 1 && (
        <circle cx={LAND[0]} cy={LAND[1]} r={mix(12, 196, ring)} fill="none" stroke={COLOR.wash}
          strokeWidth={mix(3.4, 0.4, ring)} opacity={0.4 * (1 - ring)} />
      )}
      {ring2 > 0 && ring2 < 1 && (
        <circle cx={LAND[0]} cy={LAND[1]} r={mix(12, 140, ring2)} fill="none" stroke={COLOR.wash}
          strokeWidth={mix(2.4, 0.3, ring2)} opacity={0.26 * (1 - ring2)} />
      )}
      {/* spatter: it leaves the impact point and is on the paper by 1.35 s, then soaks in */}
      {hit > 0 && soak > 0 && SPLAT.map((s, i) => {
        const x = LAND[0] + s.dx * hit, y = LAND[1] + s.dy * hit - Math.sin(hit * Math.PI) * 26;
        return <circle key={i} cx={x} cy={y} r={s.r * mix(0.5, 1, hit)} fill={COLOR.wash} opacity={0.62 * soak} />;
      })}
    </Canvas>
  );
};
