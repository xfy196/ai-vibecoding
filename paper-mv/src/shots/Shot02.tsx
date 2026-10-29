import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { pulse, ramp } from '../anim';
import { Sparkle } from '../paper/figures';
import { Camera, GrainOverlay, Paper, Svg, Vignette } from '../paper/Paper';
import { blob, wavePath } from '../paper/paths';
import { BEAT, C, H, W, light, mix } from '../theme';

/** ? ?pull back, the clouds swallow the moon, one lantern left in the dark. */
export const Shot02: React.FC<{ t0: number }> = ({ t0 }) => {
  const frame = useCurrentFrame();
  const g = frame + t0;
  const lf = frame;

  const camScale = ramp(lf, 0, 62, 1.55, 1.0);
  const camY = ramp(lf, 0, 62, -60, 10);
  const moonDim = ramp(lf, 4, 40, 0.95, 0.16);
  const lantern = pulse(g, BEAT, 1.8);

  const stars = [
    [180, 140, 11],
    [420, 240, 8],
    [640, 120, 9],
    [900, 200, 7],
    [1560, 150, 10],
    [1740, 300, 8],
    [1220, 110, 7],
    [300, 380, 6],
    [1420, 420, 6],
    [760, 330, 6],
    [1880, 180, 7],
    [90, 260, 6],
  ] as const;

  const clouds = [
    { x0: -420, y: 250, rx: 340, ry: 96, speed: 8.5, seed: 21, tone: 0.72 },
    { x0: -700, y: 336, rx: 300, ry: 76, speed: 6.4, seed: 22, tone: 0.5 },
    { x0: -260, y: 176, rx: 260, ry: 64, speed: 10.5, seed: 23, tone: 0.85 },
  ];

  const bands = [0, 1, 2, 3].map((i) => ({
    i,
    y: 700 + i * 74 + Math.sin(g * 0.05 + i) * 8,
    color: mix(C.sea3, C.inkDeep, 0.18 + i * 0.16),
  }));

  return (
    <AbsoluteFill style={{ backgroundColor: C.inkDeep }}>
      <Svg>
        <defs>
          <linearGradient id="s2sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#03060f" />
            <stop offset="55%" stopColor="#08122b" />
            <stop offset="100%" stopColor="#0b1c3c" />
          </linearGradient>
        </defs>

        <Camera scale={camScale * (1 + 0.0065 * pulse(g, BEAT, 3))} y={camY} x={0}>
          <rect width={W} height={H} fill="url(#s2sky)" />

          {stars.map(([x, y, r], i) => {
            const blink = pulse(g + i * 4.5, BEAT / 2, 3.2);
            return (
              <Sparkle
                key={i}
                x={x}
                y={y}
                r={r * (0.7 + 0.5 * blink)}
                fill={C.foam}
                opacity={(0.18 + 0.62 * blink) * (0.5 + 0.5 * moonDim)}
              />
            );
          })}

          {/* the moon being covered */}
          <g opacity={moonDim}>
            <circle cx={1226} cy={296} r={176} fill="url(#glMoon)" opacity={0.9} />
            <circle cx={1226} cy={296} r={168} fill={C.moon} />
            <circle cx={1226} cy={296} r={168} fill="url(#fiber)" opacity={0.3} />
            <circle cx={1226} cy={296} r={168} fill="none" stroke={light(C.moon, 0.3)} strokeWidth={3} opacity={0.5} />
          </g>

          {/* dark clouds drifting across the moon */}
          {clouds.map((c, i) => {
            const x = c.x0 + c.speed * lf * 2.2 + i * 40;
            const d = blob(x, c.y, c.rx, c.ry, c.seed, 4, 24, 0.2);
            const col = mix(C.inkDeep, C.night2, c.tone * 0.55);
            return (
              <g key={i} transform={`translate(0 ${Math.sin(g * 0.03 + i) * 6})`}>
                <Paper d={d} fill={col} shadow="soft" edge={light(col, 0.12)} tex={0.4} opacity={0.96} />
              </g>
            );
          })}

          {/* a very wide, very dark sea, with the moon's cold road on it */}
          {bands.map((b) => (
            <g key={b.i} transform={`translate(0 ${b.y})`}>
              <Paper
                d={wavePath({
                  y: 0,
                  amp: 14,
                  wavelength: 1500 + b.i * 200,
                  phase: b.i * 1.1 + g * 0.02,
                  jag: 3,
                  seed: 60 + b.i,
                  bottom: 900,
                  step: 40,
                })}
                fill={b.color}
                shadow="soft"
                edge={light(b.color, 0.22)}
                tex={0.5}
              />
            </g>
          ))}
          <ellipse
            cx={1226}
            cy={930}
            rx={132}
            ry={230}
            fill={C.moon}
            opacity={0.1 * moonDim + 0.03}
          />
          <ellipse cx={1226} cy={900} rx={54} ry={150} fill={C.moon} opacity={0.12 * moonDim} />

          {/* the only light left: one lantern on a tiny boat */}
          <g transform={`translate(${726 + Math.sin(g * 0.05) * 8} ${838 + Math.sin(g * 0.07) * 5})`}>
            <g transform="scale(0.34)">
              <Paper
                d="M -96 0 L 96 0 L 52 46 Q 0 62 -52 46 Z"
                fill="#0b1730"
                shadow="near"
                edge={light('#0b1730', 0.3)}
              />
              <path d="M -70 -6 L -14 -104 L -14 -6 Z" fill="#101f3f" />
              <path d="M 14 -6 L 14 -92 L 62 -6 Z" fill="#0e1b38" />
            </g>
            <circle r={150} fill="url(#glLantern)" opacity={0.35 + 0.55 * lantern} />
            <circle r={13 + 5 * lantern} fill={C.amber2} opacity={0.95} />
            <circle r={26 + 10 * lantern} fill={C.amber} opacity={0.35 + 0.3 * lantern} />
          </g>

          <Vignette opacity={1} />
          <GrainOverlay opacity={0.16} dust={0.26} />
        </Camera>
      </Svg>
    </AbsoluteFill>
  );
};
