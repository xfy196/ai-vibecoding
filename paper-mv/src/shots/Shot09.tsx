import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { pulse, ramp, springIn } from '../anim';
import { Boy, Moon, PaperBoat } from '../paper/figures';
import { Camera, GrainOverlay, Paper, Svg, Vignette } from '../paper/Paper';
import { wavePath } from '../paper/paths';
import { BEAT, C, H, W, light, mix } from '../theme';

/** ⑨ 尾声 — the layers drop away one per beat, the boat sails into the moon, fade out. */
export const Shot09: React.FC<{ t0: number }> = ({ t0 }) => {
  const frame = useCurrentFrame();
  const g = frame + t0;
  const lf = frame;

  // four paper seas, one falling on each beat
  const seas = [0, 1, 2, 3].map((i) => {
    const start = t0 + i * BEAT;
    const drop = springIn(g, start, { damping: 16, stiffness: 55, mass: 1.4 });
    return {
      i,
      y: 620 + i * 108 + drop * 210,
      opacity: 1 - drop * 0.25,
      color: mix(C.sea3, C.inkDeep, 0.15 + i * 0.24),
    };
  });

  const sail = ramp(lf, 0, 46, 0, 1);
  const boatX = 560 + sail * 372;
  const boatY = 946 - sail * 470;
  const boatScale = 0.52 - sail * 0.4;
  const fade = ramp(lf, 38, 51, 0, 1);

  return (
    <AbsoluteFill style={{ backgroundColor: C.inkDeep }}>
      <Svg>
        <defs>
          <linearGradient id="s9sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#03060f" />
            <stop offset="52%" stopColor="#0a1734" />
            <stop offset="100%" stopColor="#102a52" />
          </linearGradient>
        </defs>

        <Camera scale={(1 + sail * 0.04) * (1 + 0.0065 * pulse(g, BEAT, 3))}>
          <rect width={W} height={H} fill="url(#s9sky)" />
          <Moon x={960} y={430} r={214} halo={1.1} />

          {/* the boat shrinking into the moon */}
          <g transform={`translate(${boatX} ${boatY}) scale(${boatScale})`} opacity={1 - fade * 0.55}>
            <PaperBoat hull={C.paper} sail={C.cream} sail2={C.moon2} />
            <Boy x={-4} y={-8} scale={0.6} fill={C.ink} lanternGlow={0.5 + 0.4 * (1 - sail)} />
          </g>

          {seas.map((s) => (
            <g key={s.i} transform={`translate(0 ${s.y})`} opacity={s.opacity}>
              <Paper
                d={wavePath({
                  y: 0,
                  amp: 14,
                  wavelength: 1100 + s.i * 140,
                  phase: s.i * 1.1 + g * 0.02,
                  jag: 3.5,
                  seed: 950 + s.i,
                  bottom: 700,
                  step: 32,
                })}
                fill={s.color}
                shadow="soft"
                edge={light(s.color, 0.22)}
                tex={0.5}
              />
            </g>
          ))}

          <Vignette opacity={0.9} />
          <GrainOverlay opacity={0.15} dust={0.2} />
          <rect width={W} height={H} fill="#02040a" opacity={fade} />
        </Camera>
      </Svg>
    </AbsoluteFill>
  );
};
