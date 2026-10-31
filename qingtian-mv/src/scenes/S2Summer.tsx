// S2 · 12–28 s · 夏 · 便当与九封信 (S05 S11)
// A bento in top view, and nine letters stacked beside it. Nothing new arrives: each letter is
// lifted 13 px in turn and its number is wiped in behind its own corner. One lift every 1.2 s.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Canvas, EASE, prog} from '../lib/motion';
import {Bento, Dapple, Digit, Envelope} from '../lib/film';
import {COLOR, T} from '../spec';

const EW = 330, EH = 205;
const X0 = 1146, Y0 = 468, DX = 34, DY = 30; // the pile: each one sits down and right of the last

export const S2Summer: React.FC<{t: number}> = ({t}) => {
  if (t < T.summerIn || t >= 28.4) return null;
  // in from below at 12, out downwards at 26.2 — the scene travels, it never dissolves
  const enter = prog(t, T.bentoIn, 1.8, EASE.out);
  const leave = prog(t, T.summerOut, 1.5, EASE.in);
  const shift = (1 - enter) * 130 + leave * 980;

  return (
    <AbsoluteFill>
      {/* E15 light: patches moving over the cloth all through the scene */}
      <Dapple t={t} o={0.9} />

      {/* the overexposed top of the summer frame — part of the light, not of the content */}
      <Canvas>
        <rect x={0} y={0} width={1920} height={150} fill={COLOR.summerWash} opacity={0.38} />
        <rect x={0} y={116} width={1920} height={14} fill={COLOR.summerWash} opacity={0.5} />
      </Canvas>

      <AbsoluteFill style={{transform: `translateY(${shift}px)`}}>
        <Canvas>
          {/* E05 the bento */}
          <Bento x={712} y={606} opacity={1} />

          {/* E06 the nine letters */}
          {Array.from({length: T.liftCount}, (_, i) => {
            const x = X0 + i * DX, y = Y0 + i * DY;
            const l0 = T.lift0 + i * T.liftStep;
            const up = prog(t, l0, 0.42, EASE.out);
            const down = prog(t, l0 + 0.45, 0.5, EASE.in);
            const lift = 13 * up * (1 - down);
            return (
              <g key={i}>
                <Envelope x={x} y={y} w={EW} h={EH} lift={lift} tilt={(i - 4) * 0.7} />
                <Digit n={i + 1} x={x + 9} y={y - lift + 24} p={prog(t, l0 + 0.12, 0.26, EASE.out)} id={`num-${i}`} size={20} />
              </g>
            );
          })}
        </Canvas>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
