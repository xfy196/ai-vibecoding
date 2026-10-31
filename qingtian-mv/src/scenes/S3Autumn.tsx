// S3 · 28–42 s · 秋 · 向上与向下 (S06 S12)
// Two layers, moving against each other. Above the ridge the clouds and the crowns climb: a camera
// tilting up. Below it the boy folds down and reaches for a flower that is rising, not falling.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Canvas, Character, EASE, mix, prog, rand} from '../lib/motion';
import {BOY, Cloud, Crown, Flower, boyPose} from '../lib/film';
import {COLOR, T} from '../spec';

const HORIZON = 644;

// upward drift with a wrap that always happens outside the visible band
const driftUp = (base: number, speed: number, tau: number, span: number, margin: number) =>
  ((((base + margin - speed * tau) % span) + span) % span) - margin;

// nine crowns, 138 px apart in a 1100 px cycle: the band is never empty, and each wrap is off frame
const CROWNS = [-400, -262, -124, 14, 152, 290, 428, 566, 704].map((b, i) => ({
  base: b,
  x: 210 + ((i * 947) % 1480),
  s: 0.78 + rand(`cs-${i}`) * 0.58,
  seed: i * 7 + 3,
}));
const CLOUDS = [700, 520, 340, 160, -20, -200].map((b, i) => ({
  base: b,
  x: 260 + ((i * 613) % 1420),
  s: 0.66 + rand(`cl-${i}`) * 0.4,
}));

export const S3Autumn: React.FC<{t: number}> = ({t}) => {
  if (t < T.autumnIn || t >= T.winterIn) return null;
  const tau = t - T.autumnIn;
  // the field rises into frame from the bottom: the camera tilts up, nothing pops in
  const reveal = prog(t, 27.9, 1.2, EASE.out);

  // E10 the flower: 680 px over 13.7 s, with a sway long enough to read as suspension
  const rise = prog(t, T.flower0, T.flower1 - T.flower0, EASE.smooth);
  const fy = mix(1150, 470, rise);
  const fx = 710 + 20 * Math.sin((t - T.flower0) * 0.42);

  return (
    <AbsoluteFill>
      <Canvas>
        <defs>
          <clipPath id="upper">
            <rect x={-40} y={-40} width={2000} height={HORIZON + 40} />
          </clipPath>
          <clipPath id="reveal">
            <rect x={-40} y={mix(1080, -40, reveal)} width={2000} height={1160} />
          </clipPath>
        </defs>

        <g clipPath="url(#reveal)">
          {/* ---- upper layer, clipped at the ridge ---- */}
          <g clipPath="url(#upper)">
            {CLOUDS.map((c, i) => (
              <Cloud key={`c${i}`} x={c.x} y={driftUp(c.base, 26, tau, 1200, 400)} s={c.s} o={0.95} />
            ))}
            {CROWNS.map((c, i) => {
              const y = driftUp(c.base, 54, tau, 1100, 300);
              const s = c.s * mix(0.62, 1.24, Math.max(0, Math.min(1, 1 - y / 700))); // near trees are big
              return <Crown key={`k${i}`} x={c.x} y={y} s={s} seed={c.seed} />;
            })}
          </g>

          {/* ---- the ground, over the ridge so the crowns come out from behind it ---- */}
          <rect x={0} y={HORIZON} width={1920} height={1080 - HORIZON} fill={COLOR.autumnGround} />
          <rect x={0} y={HORIZON} width={1920} height={9} fill={COLOR.autumnGrass} opacity={0.5} />
          {[764, 838, 946].map((y, i) => (
            <line key={i} x1={0} y1={y} x2={1920} y2={y} stroke={COLOR.autumnGrass} strokeWidth={1.6} opacity={0.32 - i * 0.07} />
          ))}
          {Array.from({length: 34}, (_, i) => {
            const x = rand(`g${i}`) * 1920;
            const h = 16 + rand(`gh${i}`) * 26;
            return (
              <path
                key={i}
                d={`M${x} ${HORIZON + 6} q${(rand(`gs${i}`) - 0.5) * 12} ${-h * 0.6} ${(rand(`gt${i}`) - 0.5) * 16} ${-h}`}
                stroke={COLOR.autumnGrass}
                strokeWidth={2}
                fill="none"
                opacity={0.45}
              />
            );
          })}

          {/* ---- E09 the boy folded over the field, and the flower rising past his hand ---- */}
          <ellipse cx={966} cy={1008} rx={110} ry={16} fill={COLOR.ink} opacity={0.12} />
          <Character body={BOY} pose={boyPose(t)} />
          <Flower x={fx} y={fy} rot={8 * tau} s={0.95} />
        </g>
      </Canvas>
    </AbsoluteFill>
  );
};
