import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { pulse, pulseFrom, ramp, springIn } from '../anim';
import { Boy, Moon, PaperBoat, Sparkle } from '../paper/figures';
import { Camera, GrainOverlay, Paper, Svg, Vignette } from '../paper/Paper';
import { crestPath, wavePath } from '../paper/paths';
import { BEAT, C, H, W, dark, light, mix } from '../theme';

export const Shot01: React.FC<{ t0: number }> = ({ t0 }) => {
  const frame = useCurrentFrame();
  const g = frame + t0; // global frame: keeps the 100 BPM grid shared by all shots
  const camPush = ramp(g, t0, t0 + 108, 1.0, 1.055);

  const stars = [
    [260, 180, 13],
    [520, 120, 9],
    [760, 240, 11],
    [1000, 130, 8],
    [1640, 200, 12],
    [1780, 360, 9],
    [340, 320, 8],
    [1180, 300, 10],
    [1500, 110, 7],
    [900, 420, 7],
  ] as const;

  // six paper wave layers, one per beat
  const waveOpts = (i: number) => ({
    y: 0,
    amp: 44 - i * 3,
    wavelength: 780 + i * 60,
    phase: i * 0.9 + g * 0.026 * (1 + i * 0.12),
    jag: 4,
    seed: 11 + i,
    bottom: 1250,
    step: 26,
  });
  const layers = [0, 1, 2, 3, 4, 5].map((i) => {
    const start = t0 + i * BEAT;
    const up = springIn(g, start, { damping: 12, stiffness: 88, mass: 1.1 });
    const baseY = 596 + i * 58;
    // six clearly separated paper tones, light at the back, ink at the front
    const tone = ['#5d93bb', '#48799f', '#35608a', '#254a72', '#16325a', '#0a1730'][i];
    const color = tone;
    const wob = Math.sin(g * 0.06 + i * 1.3) * 10;
    return {
      i,
      up,
      y: baseY + (1 - up) * 340 + wob,
      color,
      d: wavePath(waveOpts(i)),
      crest: crestPath(waveOpts(i)),
    };
  });

  const boatUp = springIn(g, t0 + 5 * BEAT + 12, { damping: 9, stiffness: 130 });
  const bob = Math.sin(g * 0.16) * 5;
  const lanternPulse = pulse(g, BEAT, 2.2);
  const boatX = 862;
  const boatY = 862 + (1 - boatUp) * 210 + bob;

  return (
    <AbsoluteFill style={{ backgroundColor: C.inkDeep }}>
      <Svg>
        <defs>
          <linearGradient id="s1sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#040814" />
            <stop offset="48%" stopColor={C.night1} />
            <stop offset="80%" stopColor={C.night3} />
            <stop offset="100%" stopColor={C.sea1} />
          </linearGradient>
          <radialGradient id="s1moonGlow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor={C.moon} stopOpacity="0.22" />
            <stop offset="100%" stopColor={C.moon} stopOpacity="0" />
          </radialGradient>
        </defs>

        <Camera scale={camPush * (1 + 0.0065 * pulse(g, BEAT, 3))} x={-12 * ramp(g, t0, t0 + 108)} y={0}>
          <rect width={W} height={H} fill="url(#s1sky)" />
          <rect width={W} height={H} fill="url(#s1moonGlow)" />

          {/* stars: half-beat blink */}
          {stars.map(([x, y, r], i) => (
            <Sparkle
              key={i}
              x={x}
              y={y}
              r={r * (0.75 + 0.35 * pulse(g + i * 4, BEAT / 2, 3))}
              fill={C.cream}
              opacity={0.35 + 0.5 * pulse(g + i * 5, BEAT / 2, 2.4)}
            />
          ))}

          <Moon x={1352} y={310} r={252} halo={1} />

          {/* six rising paper seas */}
          {layers.map((l) => (
            <g key={l.i} transform={`translate(0 ${l.y})`}>
              <Paper
                d={l.d}
                fill={l.color}
                shadow={l.i < 4 ? 'mid' : 'soft'}
                edge={light(l.color, 0.26)}
                tex={0.55}
              />
              <path
                d={l.crest}
                fill="none"
                stroke={mix(C.foam, l.color, 0.18)}
                strokeWidth={12 - l.i * 0.9}
                strokeLinecap="round"
                opacity={0.5 + 0.18 * pulse(g, BEAT, 2)}
              />
            </g>
          ))}

          {/* foam traces on the crest in front of the boat */}
          {[0, 1, 2].map((k) => {
            const fx = 300 + k * 560 + Math.sin(g * 0.05 + k) * 40;
            const fy = 884 + k * 42 + Math.cos(g * 0.07 + k * 1.7) * 8;
            return (
              <path
                key={k}
                d={`M ${fx} ${fy} q 60 -18 120 0`}
                stroke={C.foam}
                strokeWidth={5}
                strokeLinecap="round"
                fill="none"
                opacity={0.28 + 0.3 * pulse(g, BEAT, 2)}
              />
            );
          })}

          {/* the paper boat + the boy with the lantern, on the seventh beat */}
          <g transform={`translate(${boatX} ${boatY})`}>
            <g transform={`rotate(${-6 * boatUp + Math.sin(g * 0.12) * 2.4}) scale(0.72)`}>
              <PaperBoat hull={C.paper} sail={C.cream} sail2={C.moon2} />
              <Boy
                x={-4}
                y={-6}
                scale={0.62}
                fill={C.ink}
                lanternGlow={0.55 + 0.45 * lanternPulse}
              />
            </g>
          </g>

          {/* foreground torn strip to close the frame */}
          <g transform={`translate(0 ${1040 + Math.sin(g * 0.07) * 6})`}>
            <Paper
              d={wavePath({
                y: 0,
                amp: 12,
                wavelength: 1200,
                phase: 2.2 + g * 0.02,
                jag: 4,
                seed: 44,
                bottom: 260,
              })}
              fill={C.inkDeep}
              shadow="soft"
              edge={light(C.inkDeep, 0.12)}
            />
          </g>

          <Vignette opacity={0.9} />
          <GrainOverlay opacity={0.15} dust={0.24} />
        </Camera>
      </Svg>
    </AbsoluteFill>
  );
};
