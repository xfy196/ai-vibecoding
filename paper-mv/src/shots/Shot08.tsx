import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { easeInOut, easeOut, pulse, ramp } from '../anim';
import { EyeShape, PaperBoat, Sparkle } from '../paper/figures';
import { Camera, GrainOverlay, Paper, Svg, Vignette } from '../paper/Paper';
import { wavePath } from '../paper/paths';
import { BEAT, C, H, W, light, mix } from '../theme';

/** ???the moon becomes the reflection in her eye; we push in on the downbeat. */
export const Shot08: React.FC<{ t0: number }> = ({ t0 }) => {
  const frame = useCurrentFrame();
  const g = frame + t0;
  const lf = frame;

  const open = easeOut(ramp(lf, 0, 9, 0, 1));
  const eyeH = 40 + open * 700;
  const zoom = 1 + easeInOut(ramp(lf, 8, 66, 0, 1)) * 3.55;

  return (
    <AbsoluteFill style={{ backgroundColor: C.dusk3 }}>
      <Svg>
        <defs>
          <radialGradient id="s8skin" cx="0.5" cy="0.4" r="0.75">
            <stop offset="0%" stopColor={mix(C.dusk2, C.gold2, 0.28)} />
            <stop offset="60%" stopColor={C.dusk2} />
            <stop offset="100%" stopColor={C.dusk4} />
          </radialGradient>
          <radialGradient id="s8iris" cx="0.5" cy="0.42" r="0.62">
            <stop offset="0%" stopColor="#0d1f42" />
            <stop offset="62%" stopColor="#091530" />
            <stop offset="100%" stopColor="#050b1c" />
          </radialGradient>
          <linearGradient id="s8sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#050d20" />
            <stop offset="46%" stopColor="#0d2149" />
            <stop offset="70%" stopColor="#17325e" />
            <stop offset="100%" stopColor="#0a1730" />
          </linearGradient>
        </defs>

        <Camera scale={zoom} originX={960} originY={520}>
          {/* her face: a big paper sheet */}
          <rect width={W} height={H} fill="url(#s8skin)" />
          <rect width={W} height={H} fill="url(#fiber)" opacity={0.22} />

          <EyeShape cx={960} cy={520} w={1560} h={eyeH} skin={mix(C.dusk2, C.paper, 0.18)} lid={0}>
            {/* the iris disc: the moon she is looking at */}
            <g transform="translate(960 520)">
              <circle r={330} fill="url(#s8iris)" />
              {/* inner night: the reflection scene */}
              <g transform="translate(-960 -520)">
                <rect x={0} y={0} width={W} height={H} fill="url(#s8sky)" />
                {[
                  [820, 300, 9],
                  [1080, 250, 7],
                  [760, 420, 6],
                  [1220, 390, 8],
                  [960, 200, 6],
                ].map(([x, y, r], i) => (
                  <Sparkle
                    key={i}
                    x={x as number}
                    y={y as number}
                    r={(r as number) * (0.7 + 0.45 * pulse(g + i * 6, BEAT / 2, 3))}
                    fill={C.cream}
                    opacity={0.3 + 0.45 * pulse(g + i * 6, BEAT / 2, 2.6)}
                  />
                ))}
                {/* reflection moon */}
                <g transform="translate(960 424)">
                  <circle r={210} fill="url(#glMoon)" opacity={0.75} />
                  <circle r={58} fill={C.moon} />
                </g>
                {/* the sea in her eye */}
                {[0, 1, 2].map((i) => (
                  <g key={i} transform={`translate(0 ${548 + i * 34 + Math.sin(g * 0.05 + i) * 4})`}>
                    <Paper
                      d={wavePath({
                        y: 0,
                        amp: 5,
                        wavelength: 700 + i * 130,
                        phase: i * 1.3 + g * 0.03,
                        jag: 2.5,
                        seed: 900 + i,
                        bottom: 700,
                        step: 28,
                      })}
                      fill={mix(C.sea2, C.ink, 0.1 + i * 0.3)}
                      edge={light(C.sea2, 0.3)}
                      tex={0.45}
                    />
                  </g>
                ))}
                {/* two of them, sitting in the boat */}
                <g transform="translate(960 566) scale(0.34)">
                  <PaperBoat hull={C.paper} sail={C.cream} sail2={C.moon2} />
                  <g fill={C.ink}>
                    <circle cx={-26} cy={-96} r={15} />
                    <path d="M -42 -84 C -48 -60 -46 -34 -42 -22 L -10 -22 C -8 -40 -8 -66 -14 -84 Z" />
                    <circle cx={30} cy={-100} r={15} />
                    <path d="M 14 -88 C 8 -64 10 -36 14 -22 L 46 -22 C 50 -42 48 -68 42 -88 Z" />
                    <path d="M -16 -70 L -6 -74 L 10 -74 L 22 -70" stroke={C.ink} strokeWidth={5} fill="none" />
                  </g>
                </g>
              </g>
              {/* iris rim: paper moon edge */}
              <circle r={330} fill="none" stroke={C.moon} strokeWidth={14} opacity={0.85} />
              <circle r={344} fill="none" stroke={light(C.dusk2, 0.35)} strokeWidth={7} opacity={0.5} />
            </g>
          </EyeShape>

          {/* soft specular sheet over the eye at the very start */}
          <rect
            width={W}
            height={H}
            fill={C.moon}
            opacity={ramp(lf, 0, 10, 0.5, 0)}
            style={{ mixBlendMode: 'screen' }}
          />

          <Vignette opacity={0.55} />
          <GrainOverlay opacity={0.14} dust={0.2} />
        </Camera>
      </Svg>
    </AbsoluteFill>
  );
};
