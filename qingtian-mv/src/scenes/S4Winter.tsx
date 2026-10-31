// S4 · 42–52 s · 冬 · 雨与雷 (S07 S13 S14)
// The cut is hard, on the beat. For three frames a single clean polyline crosses the frame — one
// flash, no repeats — and the cello draws itself out of the dark. The bow moves a degree and a half.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Canvas, EASE, prog} from '../lib/motion';
import {Cello} from '../lib/film';
import {COLOR, T} from '../spec';

const BOLT = [[1436, 24], [1252, 322], [1352, 350], [1086, 616], [1178, 646], [986, 908]];
const BRANCH = [[1252, 322], [1160, 470]];

export const S4Winter: React.FC<{t: number}> = ({t}) => {
  if (t < T.winterIn || t >= T.winterOut) return null;
  const flash = t >= T.bolt0 && t < T.bolt0 + 0.1; // exactly three frames at 30 fps
  const draw = prog(t, 42.0, 0.6, EASE.out);
  const ph = (t - 42.5) / 1.55; // one bow stroke every 1.55 s
  const bow = T.bowAmp * Math.sin(2 * Math.PI * ph);
  const dx = 13 * Math.sin(2 * Math.PI * ph + 0.5);

  return (
    <AbsoluteFill>
      <Canvas>
        {/* the sky lifts for the flash, then goes back: one flash only */}
        {flash && <rect x={0} y={0} width={1920} height={1080} fill="#3B4753" />}

        {/* E16 street: three blocks, a wet road, four reflections */}
        {[[96, 560, 330], [470, 640, 268], [1560, 596, 300]].map(([x, y, w], i) => (
          <g key={i}>
            <rect x={x} y={y} width={w} height={800 - y} fill={COLOR.winterBlock} />
            {Array.from({length: Math.floor(w / 56)}, (_, k) => (
              <rect key={k} x={x + 18 + k * 56} y={y + 34} width={26} height={34} fill={COLOR.winterBg} opacity={0.55} />
            ))}
          </g>
        ))}
        <rect x={0} y={800} width={1920} height={280} fill={COLOR.winterGround} />
        <line x1={0} y1={800} x2={1920} y2={800} stroke={COLOR.winterLine} strokeWidth={1.6} opacity={0.22} />
        {[[246, 92], [702, 54], [1218, 76], [1666, 60]].map(([x, w], i) => (
          <rect key={i} x={x} y={806} width={w} height={230} fill={COLOR.winterLine} opacity={0.09} />
        ))}

        {/* E11 the cello, drawn on out of the flash */}
        <Cello x={1010} y={548} p={draw} bow={bow} dx={dx} />

        {/* E17 the lightning: one polyline, three frames */}
        {flash && (
          <g>
            <polyline points={BOLT.map(([x, y]) => `${x},${y}`).join(' ')} fill="none" stroke={COLOR.bolt} strokeWidth={5} strokeLinejoin="miter" strokeLinecap="butt" />
            <polyline points={BRANCH.map(([x, y]) => `${x},${y}`).join(' ')} fill="none" stroke={COLOR.bolt} strokeWidth={3} strokeLinejoin="miter" />
          </g>
        )}
      </Canvas>
    </AbsoluteFill>
  );
};
