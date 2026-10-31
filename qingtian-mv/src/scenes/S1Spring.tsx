// S1 · 0–12 s · 春 · 纽扣 (S04 S09 S10)
// A wall of pale warm light. The uniform is only a collar, a placket and one button. A hand comes in
// from the right and takes the button away on an arc, while a train slides out of frame to the left:
// two opposite movements, at the same time.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Canvas, EASE, mix, prog} from '../lib/motion';
import {Button, Dapple, Hand, Shirt, Train} from '../lib/film';
import {COLOR, T} from '../spec';

const CX = 1120; // the shirt's centre line
const GRIP: [number, number] = [CX, 566]; // E01 the button's home, on the placket
// the arc the hand carries it out on: a single quadratic, no straight lines
const arc = (p: number): [number, number] => {
  const [x0, y0] = GRIP, [x1, y1] = [1560, 292], [x2, y2] = [2040, 520];
  const u = 1 - p;
  return [u * u * x0 + 2 * u * p * x1 + p * p * x2, u * u * y0 + 2 * u * p * y1 + p * p * y2];
};

export const S1Spring: React.FC<{t: number}> = ({t}) => {
  if (t >= 12.05) return null;
  const clear = prog(t, T.springClear, 0.9, EASE.smooth); // the lines give up before the season changes
  const drift = prog(t, 0, 12, EASE.smooth); // the light on the wall slides down all scene long

  // the hand: in along a shallow path, then out along the arc with the button
  const reach = prog(t, T.handIn, T.grip - T.handIn, EASE.out);
  const carry = prog(t, T.grip, T.buttonOut - T.grip, EASE.smooth);
  const carried = arc(carry);
  const hx = carry > 0 ? carried[0] : mix(1560, GRIP[0], reach);
  const hy = carry > 0 ? carried[1] : mix(590, GRIP[1], reach);

  const trainX = mix(400, -780, prog(t, T.trainIn, T.trainOut - T.trainIn, EASE.smooth));

  return (
    <AbsoluteFill>
      <Dapple t={t} o={1 - clear} />
      <Canvas>
        {/* E15 light: flat bands on the wall, never a gradient */}
        <g opacity={1 - clear * 0.6} transform={`translate(0 ${38 * drift})`}>
          <rect x={-120} y={168} width={2160} height={116} fill={COLOR.springWash} opacity={0.62} transform="rotate(-2.4 960 226)" />
          <rect x={-120} y={330} width={2160} height={54} fill={COLOR.springWash} opacity={0.4} transform="rotate(-2.4 960 357)" />
          <rect x={104} y={-40} width={228} height={1200} fill={COLOR.springWash} opacity={0.34} transform="rotate(-2.4 218 560)" />
        </g>

        {/* E04 the train, already at the left, leaving to the left */}
        <Train x={trainX} y={880} />

        {/* E02 the uniform */}
        <Shirt cx={CX} opacity={1 - clear} thread={prog(t, T.grip + 0.1, 0.9, EASE.out) * (1 - clear)} />

        {/* E03 the hand, in front of everything it touches */}
        <g opacity={1 - clear * 0.9}>
          <Hand x={hx} y={hy} angle={mix(-4, -22, carry)} arm={520} scale={1.45} />
        </g>

        {/* E01 the button: on the placket until it is taken, then in front of the fingers */}
        <g opacity={1 - clear}>
          {t < T.grip && <Button x={GRIP[0]} y={GRIP[1]} r={19} />}
          {t >= T.grip && (
            <Button x={hx - 18 * prog(t, T.grip, 0.4, EASE.out)} y={hy} r={19} spin={carry * 148} />
          )}
        </g>
      </Canvas>
    </AbsoluteFill>
  );
};
