import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { pulse, ramp, springIn } from '../anim';
import { Boy, Girl, PaperBoat, Sparkle } from '../paper/figures';
import { Camera, GrainOverlay, Paper, Svg, Vignette } from '../paper/Paper';
import { mulberry32, smoothPath, tornStrip, wavePath } from '../paper/paths';
import { BEAT, C, H, W, light, mix } from '../theme';

function tornPanel(innerX: number, side: -1 | 1, seed: number, gap: number): string {
  const rnd = mulberry32(seed);
  const pts: [number, number][] = [];
  const outer = side === -1 ? -260 : 2180;
  const x = innerX + side * gap;
  pts.push([outer, -160]);
  for (let y = -160; y <= 1240; y += 36) {
    const wob = Math.sin(y * 0.011 + seed) * 8 + (rnd() - 0.5) * 10;
    pts.push([x + wob, y]);
  }
  pts.push([outer, 1240]);
  return smoothPath(pts, true, 0.5);
}

/** ? ?two paper sheets tear apart on the downbeat; the gap only grows. */
export const Shot06: React.FC<{ t0: number }> = ({ t0 }) => {
  const frame = useCurrentFrame();
  const g = frame + t0;
  const lf = frame;

  const split = springIn(g, t0, { damping: 17, stiffness: 80, mass: 1.1 });
  const gap = 6 + split * 250;
  const drift = ramp(lf, 0, 105, 0, 1);
  const boatPulse = pulse(g, BEAT, 2.2);

  const leftPanel = tornPanel(960, -1, 311, gap);
  const rightPanel = tornPanel(960, 1, 312, gap);

  return (
    <AbsoluteFill style={{ backgroundColor: '#050912' }}>
      <Svg>
        <defs>
          <linearGradient id="s6skyL" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#071026" />
            <stop offset="55%" stopColor="#0e2044" />
            <stop offset="100%" stopColor="#16305c" />
          </linearGradient>
          <linearGradient id="s6skyR" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.dusk4} />
            <stop offset="42%" stopColor={C.dusk3} />
            <stop offset="72%" stopColor={C.dusk2} />
            <stop offset="100%" stopColor={C.dusk1} />
          </linearGradient>
          <linearGradient id="s6slit" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#000" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#05080f" stopOpacity="1" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.95" />
          </linearGradient>
          <radialGradient id="s6sun" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor={C.gold2} stopOpacity="0.8" />
            <stop offset="45%" stopColor={C.dusk1} stopOpacity="0.28" />
            <stop offset="100%" stopColor={C.dusk1} stopOpacity="0" />
          </radialGradient>
          <clipPath id="s6clipL">
            <path d={leftPanel} />
          </clipPath>
          <clipPath id="s6clipR">
            <path d={rightPanel} />
          </clipPath>
        </defs>

        <Camera scale={(1.0 - drift * 0.03) * (1 + 0.0065 * pulse(g, BEAT, 3))}>
          {/* the void behind the two sheets */}
          <rect width={W} height={H} fill="url(#s6slit)" />
          <rect x={860} y={0} width={220} height={H} fill="#04070d" />
          <rect x={900} y={0} width={120} height={H} fill="url(#glCool)" opacity={0.12} />

          {/* ---- left sheet: the sea and the boy's boat ---- */}
          <g transform={`translate(${-gap * 0.55} 0)`}>
            <Paper d={leftPanel} fill={mix('#0a1730', '#050a16', 0.4)} shadow="soft" tex={0.5} edge={light('#0a1730', 0.18)} />
            <g clipPath="url(#s6clipL)">
              <rect x={-260} y={-160} width={1300} height={1400} fill="url(#s6skyL)" />
              {[
                [180, 190, 10],
                [420, 120, 8],
                [680, 260, 9],
                [820, 150, 7],
                [300, 340, 7],
              ].map(([x, y, r], i) => (
                <Sparkle
                  key={i}
                  x={x as number}
                  y={y as number}
                  r={(r as number) * (0.7 + 0.4 * pulse(g + i * 6, BEAT / 2, 3))}
                  fill={C.foam}
                  opacity={0.25 + 0.4 * pulse(g + i * 6, BEAT / 2, 2.6)}
                />
              ))}
              {[0, 1, 2, 3].map((i) => (
                <g key={i} transform={`translate(0 ${700 + i * 76 + Math.sin(g * 0.05 + i) * 7})`}>
                  <Paper
                    d={wavePath({
                      y: 0,
                      amp: 14,
                      wavelength: 1000 + i * 160,
                      phase: i * 1.2 + g * 0.03,
                      jag: 3.5,
                      seed: 320 + i,
                      bottom: 900,
                      step: 32,
                    })}
                    fill={mix(C.sea3, C.ink, 0.15 + i * 0.22)}
                    shadow="mid"
                    edge={light(C.sea3, 0.24)}
                    tex={0.5}
                  />
                </g>
              ))}
              <g transform={`translate(${470 - drift * 330} ${790 + drift * 40 + Math.sin(g * 0.09) * 5}) scale(${0.5 - drift * 0.2})`}>
                <PaperBoat hull={C.paper} sail={C.cream} sail2={C.moon2} />
                <Boy x={-4} y={-8} scale={0.58} fill={C.ink} lanternGlow={0.4 + 0.45 * boatPulse} />
              </g>
            </g>
            {/* torn edge of the left sheet */}
            <path
              d={tornStrip(-40, 1000, 0, 4, 313, 3, 40)}
              fill="none"
              opacity={0}
            />
          </g>

          {/* ---- right sheet: the pier and the waving girl ---- */}
          <g transform={`translate(${gap * 0.55} 0)`}>
            <Paper d={rightPanel} fill={mix(C.dusk5, C.plum, 0.4)} shadow="soft" tex={0.5} edge={light(C.dusk5, 0.2)} />
            <g clipPath="url(#s6clipR)">
              <rect x={700} y={-160} width={1500} height={1400} fill="url(#s6skyR)" />
              <circle cx={1560} cy={470} r={360} fill="url(#s6sun)" opacity={0.5} />
              <circle cx={1560} cy={470} r={104} fill={mix(C.dusk1, C.gold2, 0.5)} opacity={0.85} />
              <Paper d={tornStrip(700, 2200, 300, 40, 331, 6, 40)} fill={mix(C.dusk3, C.paper, 0.3)} shadow="mid" opacity={0.5} tex={0.4} />
              <g>
                <path d={tornStrip(700, 2200, 762, 44, 332, 5, 30)} fill={mix(C.dusk6, C.plum, 0.3)} />
                <path d={tornStrip(700, 2200, 806, 16, 333, 4, 26)} fill={mix(C.plum, '#150d22', 0.3)} />
                {[0, 1, 2, 3].map((p) => (
                  <rect key={p} x={900 + p * 300} y={820} width={30} height={220} fill={mix(C.plum, '#150d22', 0.2)} />
                ))}
              </g>
              <g transform={`translate(${1290 + gap * 0.5} 762)`}>
                <g>
                  <Girl x={0} y={0} scale={1.55} fill={mix(C.plum, '#180f26', 0.35)} wave={Math.sin(g * 0.42) * 20} />
                </g>
              </g>
            </g>
          </g>

          <Vignette opacity={0.9} />
          <GrainOverlay opacity={0.16} dust={0.22} />
        </Camera>
      </Svg>
    </AbsoluteFill>
  );
};
