import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { pulse, ramp } from '../anim';
import { PaperBoat, Person, type PersonKind } from '../paper/figures';
import { Camera, GrainOverlay, Paper, Svg, Vignette } from '../paper/Paper';
import { mulberry32, tornStrip, wavePath } from '../paper/paths';
import { BEAT, C, H, W, light, mix } from '../theme';

const KINDS: PersonKind[] = ['tall', 'umbrella', 'bag', 'child', 'couple', 'hat'];

/** ? ?pink dusk pier, layered crowds sliding past, a new batch every beat. */
export const Shot05: React.FC<{ t0: number }> = ({ t0 }) => {
  const frame = useCurrentFrame();
  const g = frame + t0;
  const lf = frame;

  const beat = Math.floor(lf / BEAT);
  const beatPulse = pulse(g, BEAT, 2.4);
  const snap = beat * 58; // stop-motion step: the whole batch jumps on every beat
  const batchFlash = ramp(lf % BEAT, 0, 5, 0.35, 1);

  const layers = [
    { n: 6, y: 812, scale: 0.62, speed: 1.6, dir: 1, tone: 0.62, seed: 5 },
    { n: 5, y: 880, scale: 0.85, speed: 2.3, dir: -1, tone: 0.42, seed: 6 },
    { n: 4, y: 966, scale: 1.15, speed: 3.1, dir: 1, tone: 0.22, seed: 7 },
    { n: 3, y: 1088, scale: 1.62, speed: 4.4, dir: -1, tone: 0.05, seed: 8 },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: C.dusk3 }}>
      <Svg>
        <defs>
          <linearGradient id="s5sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.dusk5} />
            <stop offset="34%" stopColor={C.dusk4} />
            <stop offset="62%" stopColor={C.dusk3} />
            <stop offset="82%" stopColor={C.dusk2} />
            <stop offset="100%" stopColor={C.dusk1} />
          </linearGradient>
          <radialGradient id="s5sun" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor={C.gold2} stopOpacity="0.85" />
            <stop offset="45%" stopColor={C.dusk1} stopOpacity="0.3" />
            <stop offset="100%" stopColor={C.dusk1} stopOpacity="0" />
          </radialGradient>
        </defs>

        <Camera scale={(1.01 + ramp(lf, 0, 102, 0, 0.035)) * (1 + 0.0065 * pulse(g, BEAT, 3))} x={ramp(lf, 0, 102, -14, 14)}>
          <rect width={W} height={H} fill="url(#s5sky)" />
          <circle cx={1470} cy={430} r={520} fill="url(#s5sun)" opacity={0.75 + 0.25 * beatPulse} />
          <circle cx={1470} cy={430} r={132} fill={mix(C.dusk1, C.gold2, 0.55)} opacity={0.9} />

          {/* soft paper clouds */}
          <Paper d={tornStrip(-100, 1400, 250, 46, 31, 6, 40)} fill={mix(C.dusk3, C.paper, 0.35)} shadow="mid" opacity={0.55} tex={0.4} />
          <Paper d={tornStrip(600, 2020, 350, 34, 32, 6, 40)} fill={mix(C.dusk2, C.paper, 0.4)} shadow="mid" opacity={0.5} tex={0.4} />

          {/* sea behind the pier */}
          <Paper
            d={wavePath({ y: 664, amp: 12, wavelength: 760, phase: g * 0.03, jag: 3.5, seed: 41, bottom: 800, step: 30 })}
            fill={mix(C.dusk4, C.dusk3, 0.35)}
            shadow="mid"
            edge={mix(C.dusk1, C.paper, 0.4)}
          />
          {[0, 1, 2, 3].map((k) => (
            <path
              key={k}
              d={`M ${140 + k * 470 + Math.sin(g * 0.04 + k) * 30} ${686 + k * 9} q 70 -10 150 2`}
              stroke={mix(C.dusk1, C.paper, 0.5)}
              strokeWidth={4}
              fill="none"
              opacity={0.35}
              strokeLinecap="round"
            />
          ))}

          {/* pier deck */}
          <g>
            <path d={tornStrip(-60, 1990, 742, 46, 51, 5, 30)} fill={mix(C.dusk6, C.plum, 0.35)} />
            <path d={tornStrip(-60, 1990, 788, 16, 52, 4, 26)} fill={mix(C.plum, '#150d22', 0.3)} />
            {[0, 1, 2, 3, 4, 5].map((p) => (
              <rect key={p} x={60 + p * 340} y={800} width={34} height={210} fill={mix(C.plum, '#150d22', 0.22)} />
            ))}
          </g>

          {/* crowd layers, back to front; each beat swaps the batch */}
          {layers.map((L) => {
            const persons = [];
            for (let k = 0; k < L.n; k++) {
              const rnd = mulberry32(L.seed * 1000 + k * 37 + beat * 13);
              const base = (k / L.n) * 2320 + rnd() * 180;
              const travel = L.speed * lf + snap;
              const span = 2400;
              let x = L.dir > 0 ? ((base + travel) % span) - 220 : 2140 - ((base + travel) % span);
              const kind = KINDS[Math.floor(rnd() * KINDS.length)];
              const bob = Math.abs(Math.sin((lf + k * 7) * 0.16)) * 5;
              const scale = L.scale * (0.94 + rnd() * 0.16);
              persons.push(
                <Person
                  key={`${k}-${beat}`}
                  x={x}
                  y={L.y - bob}
                  scale={scale}
                  kind={kind}
                  fill={mix(C.plum, C.dusk4, L.tone)}
                  step={(lf + k * 9) * 0.35}
                  opacity={0.96 * batchFlash}
                />,
              );
            }
            return (
              <g key={L.seed}>
                <g>{persons}</g>
              </g>
            );
          })}

          {/* the boat drifting past, lower left, still carrying its lantern */}
          <g transform={`translate(${240 + Math.sin(g * 0.05) * 10} ${706 + Math.sin(g * 0.08) * 4}) scale(0.3)`}>
            <PaperBoat hull={C.paper} sail={C.cream} sail2={C.moon2} />
            <circle cx={34} cy={-44} r={70} fill="url(#glLantern)" opacity={0.5 + 0.4 * beatPulse} />
            <circle cx={34} cy={-44} r={9} fill={C.amber2} />
          </g>

          <Vignette opacity={0.8} />
          <GrainOverlay opacity={0.17} dust={0.22} />
        </Camera>
      </Svg>
    </AbsoluteFill>
  );
};
