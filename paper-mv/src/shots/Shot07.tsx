import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { pulse, ramp } from '../anim';
import { Boy, PaperBoat, SkyLantern } from '../paper/figures';
import { Camera, GrainOverlay, Paper, Svg, Vignette } from '../paper/Paper';
import { mulberry32, ridge, wavePath } from '../paper/paths';
import { BEAT, C, H, W, light, mix } from '../theme';

/** ? ?sky lanterns lift off behind every layer, one every half beat, camera tilts up. */
export const Shot07: React.FC<{ t0: number }> = ({ t0 }) => {
  const frame = useCurrentFrame();
  const g = frame + t0;
  const lf = frame;

  const tilt = ramp(lf, 0, 86, 70, -150);
  const zoom = 1 + ramp(lf, 0, 86, 0, 0.06);
  const glowPulse = pulse(g, BEAT, 2);

  // one lantern every half beat
  const lanterns = Array.from({ length: 11 }, (_, k) => {
    const rnd = mulberry32(700 + k * 17);
    const spawnLf = k * (BEAT / 2);
    const p = ramp(lf, spawnLf, spawnLf + 62, 0, 1);
    const x = 180 + rnd() * 1560 + Math.sin(g * 0.05 + k) * 26;
    const y = 1120 - p * 1420;
    const scale = (0.55 + rnd() * 0.55) * (0.8 + p * 0.5);
    return { k, p, x, y, scale, seed: k };
  });

  return (
    <AbsoluteFill style={{ backgroundColor: C.gold3 }}>
      <Svg>
        <defs>
          <linearGradient id="s7sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#24101c" />
            <stop offset="26%" stopColor="#6b2a1f" />
            <stop offset="52%" stopColor="#c9551f" />
            <stop offset="76%" stopColor="#f6a13a" />
            <stop offset="100%" stopColor="#ffd489" />
          </linearGradient>
          <radialGradient id="s7warm" cx="0.5" cy="0.72" r="0.62">
            <stop offset="0%" stopColor={C.gold2} stopOpacity="0.75" />
            <stop offset="100%" stopColor={C.gold3} stopOpacity="0" />
          </radialGradient>
        </defs>

        <Camera scale={zoom * (1 + 0.0065 * pulse(g, BEAT, 3))} y={tilt}>
          <rect width={W} height={H} fill="url(#s7sky)" />
          <rect y={220} width={W} height={H - 220} fill="url(#s7warm)" opacity={0.55 + 0.15 * glowPulse} />

          {/* lanterns far behind the hills */}
          {lanterns
            .filter((l) => l.k % 3 === 0)
            .map((l) => (
              <SkyLantern
                key={`far-${l.k}`}
                x={l.x}
                y={l.y}
                scale={l.scale * 0.72}
                glow={0.5 + 0.4 * glowPulse}
                fill={mix(C.gold2, C.paper, 0.45)}
                opacity={l.p * 0.85}
                rotate={Math.sin(g * 0.06 + l.k) * 5}
              />
            ))}

          {/* far ridge */}
          <Paper
            d={ridge(-100, 2020, 900, 120, 801, 5)}
            fill={mix(C.gold3, '#5a2a24', 0.55)}
            shadow="soft"
            edge={light(C.gold3, 0.25)}
            tex={0.5}
          />

          {/* the main crowd of lanterns */}
          {lanterns.map((l) => (
            <SkyLantern
              key={l.k}
              x={l.x}
              y={l.y}
              scale={l.scale}
              glow={0.65 + 0.35 * glowPulse}
              fill={mix(C.paper, C.gold2, 0.22 + 0.1 * (l.k % 3))}
              opacity={Math.min(1, l.p * 1.6)}
              rotate={Math.sin(g * 0.05 + l.k * 1.7) * 7}
            />
          ))}

          {/* near ridge, dark, in front of the lanterns */}
          <Paper
            d={wavePath({ y: 972, amp: 26, wavelength: 1100, phase: g * 0.02, jag: 5, seed: 803, bottom: 1240, step: 30 })}
            fill={mix('#2a1526', C.plum, 0.45)}
            shadow="soft"
            edge={light('#2a1526', 0.22)}
            tex={0.55}
          />

          {/* the small boat below, still lit */}
          <g transform={`translate(${860 + Math.sin(g * 0.06) * 8} ${1006 + Math.sin(g * 0.09) * 4}) scale(0.42)`}>
            <PaperBoat hull={mix(C.paper, C.gold2, 0.35)} sail={mix(C.cream, C.gold2, 0.4)} sail2={C.amber2} />
            <Boy x={-4} y={-8} scale={0.56} fill="#3a1f22" lanternGlow={0.5 + 0.5 * glowPulse} />
          </g>

          <rect width={W} height={H} fill={C.gold2} opacity={0.07} />
          <Vignette opacity={0.75} />
          <GrainOverlay opacity={0.18} dust={0.26} />
        </Camera>
      </Svg>
    </AbsoluteFill>
  );
};
