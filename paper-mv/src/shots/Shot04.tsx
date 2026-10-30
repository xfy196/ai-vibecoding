import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { pulse, ramp, springIn } from '../anim';
import { Boy, Moon, PaperBoat, Sparkle, Whale } from '../paper/figures';
import { Camera, GrainOverlay, Paper, Svg, Vignette } from '../paper/Paper';
import { blob, crestPath, wavePath } from '../paper/paths';
import { BEAT, C, H, W, light, mix } from '../theme';

/** ???the big wave rears up, the boat rides the crest, a paper whale breaches. */
export const Shot04: React.FC<{ t0: number }> = ({ t0 }) => {
  const frame = useCurrentFrame();
  const g = frame + t0;
  const lf = frame;

  const punch = 1 + 0.12 * (1 - ramp(lf, 0, 10));
  const push = ramp(lf, 10, 90, 1.0, 1.06);
  const camScale = punch * push;
  const shake = lf < 12 ? (1 - lf / 12) * 12 : 0;
  const shakeX = Math.sin(lf * 2.1) * shake;
  const shakeY = Math.cos(lf * 2.7) * shake * 0.6;

  // the moon comes back on the first beat after the hit
  const moonUp = springIn(g, t0 + BEAT, { damping: 12, stiffness: 70 });
  // whale breach: leaves the sea on the downbeat
  const leap = ramp(lf, 0, 44, 0, 1);
  const whaleRise = springIn(g, t0, { damping: 9, stiffness: 60 });
  const whaleY = 700 - whaleRise * 400 + Math.pow(leap, 2) * 120;
  const whaleRot = -34 + leap * 46;

  // the boat climbs the wave face
  const climb = ramp(lf, 0, 44, 0, 1);
  const boatY = 690 - climb * 330;
  const boatX = 430 + climb * 240;
  const boatRot = -6 - climb * 22;

  const baseWave = wavePath({
    y: 560,
    amp: 196,
    wavelength: 1650,
    phase: 1.15 + g * 0.02,
    jag: 4,
    seed: 91,
    bottom: 1250,
    step: 26,
    tilt: -300,
  });
  const foamWave = crestPath({
    y: 536,
    amp: 200,
    wavelength: 1650,
    phase: 1.15 + g * 0.02,
    jag: 5,
    seed: 92,
    bottom: 700,
    step: 22,
    tilt: -300,
  });
  return (
    <AbsoluteFill style={{ backgroundColor: '#040a16' }}>
      <Svg>
        <defs>
          <linearGradient id="s4sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#050d20" />
            <stop offset="42%" stopColor="#0b2350" />
            <stop offset="72%" stopColor="#1c5285" />
            <stop offset="100%" stopColor="#123356" />
          </linearGradient>
          <radialGradient id="s4burst" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor={C.moon} stopOpacity="0.5" />
            <stop offset="60%" stopColor={C.moon} stopOpacity="0.12" />
            <stop offset="100%" stopColor={C.moon} stopOpacity="0" />
          </radialGradient>
        </defs>

        <Camera scale={camScale * (1 + 0.0065 * pulse(g, BEAT, 3))} x={shakeX} y={shakeY}>
          <rect width={W} height={H} fill="url(#s4sky)" />

          {/* moon returning */}
          <g opacity={moonUp}>
            <circle cx={1440} cy={224} r={520} fill="url(#s4burst)" opacity={0.5 + 0.5 * pulse(g, BEAT, 2)} />
            <Moon x={1440} y={224} r={186} halo={0.8} />
          </g>
          {[
            [300, 150, 12],
            [620, 96, 9],
            [980, 150, 8],
            [1720, 320, 10],
            [1180, 84, 7],
            [200, 330, 8],
          ].map(([x, y, r], i) => (
            <Sparkle
              key={i}
              x={x}
              y={y}
              r={(r as number) * (0.7 + 0.5 * pulse(g + i * 5, BEAT / 2, 3))}
              fill={C.foam}
              opacity={0.3 + 0.5 * pulse(g + i * 5, BEAT / 2, 2.4)}
            />
          ))}

          {/* far sea */}
          <Paper
            d={wavePath({ y: 806, amp: 22, wavelength: 1200, phase: g * 0.035, jag: 4, seed: 93, bottom: 1200, step: 34 })}
            fill={mix(C.sea2, C.ink, 0.05)}
            shadow="soft"
            edge={light(C.sea1, 0.2)}
          />

          {/* moonlight burning through the wave */}
          <circle cx={780} cy={470} r={620} fill="url(#glMoon)" opacity={0.3 + 0.25 * pulse(g, BEAT, 2)} />
          <path
            d={`M -60 806 q 500 -26 2040 0`}
            stroke={C.foam}
            strokeWidth={6}
            fill="none"
            opacity={0.35}
          />

          {/* the towering wave: body, foam lip, spray */}
          <g transform="translate(0 0)">
            <Paper d={baseWave} fill={mix(C.sea4, C.teal2, 0.35)} shadow="soft" edge={light(C.sea4, 0.35)} tex={0.6} />
            <path
              d={foamWave}
              fill="none"
              stroke={C.foam}
              strokeWidth={26}
              strokeLinecap="round"
              opacity={0.92}
            />
            <path
              d={crestPath({
                y: 560,
                amp: 196,
                wavelength: 1650,
                phase: 1.15 + g * 0.02,
                jag: 6,
                seed: 95,
                step: 18,
                tilt: -300,
              })}
              fill="none"
              stroke={mix(C.foam, C.sea4, 0.3)}
              strokeWidth={12}
              strokeLinecap="round"
              opacity={0.7}
            />
            {[0, 1, 2, 3, 4].map((k) => (
              <g key={k} transform={`translate(${180 + k * 210 + Math.sin(g * 0.1 + k) * 26} ${300 + k * 46})`}>
                <Paper
                  d={blob(0, 0, 46 - k * 4, 30 - k * 3, 100 + k, 3)}
                  fill={C.foam}
                  shadow="near"
                  opacity={0.75 - k * 0.09}
                />
              </g>
            ))}
          </g>

          {/* the whale breaches on the downbeat */}
          <g opacity={ramp(lf, 0, 6)}>
            <Whale
              x={1280}
              y={whaleY}
              scale={0.82}
              rotate={whaleRot}
              fill={mix(C.whale2, C.sea4, 0.3)}
              fill2={mix(C.foam, C.sea4, 0.25)}
              spout={ramp(lf, 22, 40)}
            />
          </g>

          {/* the boat riding the crest */}
          <g transform={`translate(${boatX} ${boatY}) rotate(${boatRot}) scale(0.62)`}>
            <PaperBoat hull={C.paper} sail={C.cream} sail2={C.moon2} />
            <Boy x={-6} y={-10} scale={0.58} fill={C.ink} lanternGlow={0.45 + 0.4 * pulse(g, BEAT, 2)} />
          </g>

          {/* foreground dark swell */}
          <g transform={`translate(0 ${980 + Math.sin(g * 0.06) * 10})`}>
            <Paper
              d={wavePath({ y: 0, amp: 30, wavelength: 900, phase: 1.1 + g * 0.03, jag: 5, seed: 94, bottom: 300 })}
              fill="#040c1b"
              shadow="soft"
              edge={light('#040c1b', 0.16)}
            />
          </g>

          <rect
            width={W}
            height={H}
            fill={C.foam}
            opacity={0.55 * (1 - ramp(lf, 0, 5))}
            style={{ mixBlendMode: 'screen' }}
          />
          <Vignette opacity={0.85} />
          <GrainOverlay opacity={0.14} dust={0.26} />
        </Camera>
      </Svg>
    </AbsoluteFill>
  );
};
