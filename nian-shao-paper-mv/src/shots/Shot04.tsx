import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { clamp, easeInOut, easeOut, lerp, pulse, ramp, rampEased, rng, springIn, wobble } from '../anim';
import { Camera, Glow, GrainOverlay, Paper, Svg, Vignette, Wash } from '../paper/Paper';
import { P, tornRect } from '../paper/edges';
import { Figure, PaperChar, Sparkle } from '../paper/figures';
import { BEAT, C, FPS, light, mix } from '../theme';

/**
 * ④ 仰视塔群 — 1:26.78–1:57.42　「假如我年少有为不自卑」
 *
 * Worm's eye view: the camera sits on the pavement and looks straight up. The
 * city's towers — every paper skyscraper he never built — rise into a well of
 * gold light, then lean in over him. On "婚礼上 多喝几杯" a red 囍 drifts down
 * through the gap: the film's first warning of the wedding.
 */

const T = 86.78;
const at = (sec: number) => Math.round((sec - T) * FPS);
const VPX = 940;
const VPY = 130;

interface Tower {
  bx: number; // base x on the ground line
  bw: number; // base width
  ty: number; // top y
  lean: number; // inward lean in degrees
  fill: string;
  seed: number;
}

const TOWERS: Tower[] = [
  { bx: 60, bw: 300, ty: 250, lean: 4.2, fill: '#140d05', seed: 1 },
  { bx: 330, bw: 240, ty: 180, lean: 3.1, fill: '#3a2810', seed: 2 },
  { bx: 560, bw: 210, ty: 300, lean: 2.2, fill: '#2d2110', seed: 3 },
  { bx: 780, bw: 170, ty: 210, lean: 1.1, fill: '#4a3414', seed: 4 },
  { bx: 1080, bw: 180, ty: 190, lean: -1.4, fill: '#4a3414', seed: 5 },
  { bx: 1320, bw: 220, ty: 270, lean: -2.4, fill: '#2d2110', seed: 6 },
  { bx: 1560, bw: 250, ty: 170, lean: -3.4, fill: '#3a2810', seed: 7 },
  { bx: 1830, bw: 300, ty: 240, lean: -4.4, fill: '#2a1d0c', seed: 8 },
];

const TowerSheet: React.FC<{ t: Tower; rise: number; lit: number; lean: number }> = ({ t, rise, lit, lean }) => {
  const baseY = 1140;
  const topY = t.ty;
  const tw = t.bw * 0.42;
  const dx = (VPX - t.bx) * 0.16;
  const d =
    P([
      [t.bx - t.bw / 2, baseY],
      [t.bx + t.bw / 2, baseY],
      [t.bx + dx + tw / 2, topY],
      [t.bx + dx - tw / 2, topY],
    ]);

  const r = rng(t.seed * 31);
  const wins: React.ReactNode[] = [];
  const rows = 9;
  const cols = 3;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const u = (j + 0.5) / cols;
      const v = (i + 0.5) / rows;
      // interpolate the trapezoid at this height
      const y = lerp(baseY, topY, v);
      const halfW = lerp(t.bw / 2, tw / 2, v);
      const cx = lerp(t.bx, t.bx + dx, v);
      const px = cx + (u - 0.5) * 2 * halfW - 9;
      const on = clamp((lit - (i / rows) * 0.9 - r() * 0.15) * 5);
      if (on <= 0.02) continue;
      wins.push(
        <rect key={`${i}-${j}`} x={px} y={y - 8} width={18} height={16} fill={mix(C.gold2, C.paper, 0.25)} opacity={0.25 + 0.7 * on} />,
      );
    }
  }

  return (
    <g transform={`translate(0 ${baseY}) scale(1 ${rise}) translate(0 ${-baseY}) rotate(${lean} ${t.bx} ${baseY})`}>
      <Paper d={d} fill={t.fill} shadow="none" tex={0.5} rim={mix(C.gold, C.black, 0.4)} rimWidth={2} />
      {wins}
      {/* a hard band of shadow down one side of each tower */}
      <path d={P([[t.bx + t.bw * 0.16, baseY], [t.bx + t.bw / 2, baseY], [t.bx + dx + tw / 2, topY], [t.bx + dx + tw * 0.16, topY]])} fill="#000" opacity={0.28} />
    </g>
  );
};

export const Shot04: React.FC<{ t0: number }> = ({ t0 }) => {
  const frame = useCurrentFrame();
  const g = frame + t0;

  // camera cranes up: the scene slides down and the well of light opens
  const tilt = rampEased(frame, 0, at(117), 0, 120, easeInOut);
  const camScale = (1 + 0.06 * ramp(frame, 0, 917)) * (1 + 0.01 * pulse(g, BEAT, 3));

  const lit = ramp(frame, at(91.2), at(97), 0, 1);
  const leanOn = rampEased(frame, at(95.3), at(99), 0, 1, easeInOut);
  const wellOpen = rampEased(frame, at(91.28), at(97), 0.25, 1, easeOut);

  // the figure: turns his head on "和你现在那位"
  const look = rampEased(frame, at(113.4), at(115), 0, 1, easeInOut);
  const lightCone = rampEased(frame, at(105.82), at(108), 0, 1, easeInOut);

  // the 囍 falls through the gap
  const xi = rampEased(frame, at(110.0), at(113.4), 0, 1, easeInOut);
  const xiY = lerp(-160, 940, xi);
  const xiSpin = xi * 210;
  const xiScale = lerp(0.5, 1, easeOut(clamp(xi * 1.4)));

  const dim = 1 - 0.3 * ramp(frame, at(113.42), at(117.42));

  return (
    <AbsoluteFill style={{ backgroundColor: '#0d0803' }}>
      <Svg>
        <defs>
          <linearGradient id="s4sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#241708" />
            <stop offset="42%" stopColor="#5c3a10" />
            <stop offset="74%" stopColor="#8f5c1c" />
            <stop offset="100%" stopColor="#3a240c" />
          </linearGradient>
          <radialGradient id="s4well" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor={C.gold2} stopOpacity="0.95" />
            <stop offset="45%" stopColor={C.gold} stopOpacity="0.5" />
            <stop offset="100%" stopColor={C.amber} stopOpacity="0" />
          </radialGradient>
        </defs>

        <Camera scale={camScale} y={tilt}>
          <rect width={1920} height={1080} fill="url(#s4sky)" />

          {/* the well of light at the top of the frame */}
          <Glow x={VPX} y={VPY} r={620 + 520 * wellOpen} fill="url(#s4well)" opacity={0.75 + 0.25 * lit} />

          {/* far buildings, nearly silhouettes */}
          {new Array(11).fill(0).map((_, i) => {
            const r = rng(4400 + i);
            const w = 120 + r() * 220;
            const h = 300 + r() * 520;
            return (
              <g key={i} opacity={0.55}>
                <Paper d={tornRect({ x: -100 + i * 190, y: 1080 - h, w, h, top: 4, bottom: 0, left: 4, right: 4, step: 30, seed: 4500 + i })} fill={mix(C.ink1, C.kraft2, 0.3)} shadow="none" tex={0.4} rim={mix(C.gold, C.black, 0.55)} />
              </g>
            );
          })}

          {/* stars made of paper dust in the gap */}
          {new Array(16).fill(0).map((_, i) => {
            const r = rng(4600 + i);
            const a = r() * Math.PI * 2;
            const rad = 120 + r() * 420;
            return (
              <Sparkle
                key={i}
                x={VPX + Math.cos(a) * rad}
                y={VPY + Math.sin(a) * rad * 0.7}
                r={4 + r() * 8}
                fill={C.gold2}
                opacity={(0.2 + 0.6 * r()) * (0.5 + 0.5 * pulse(g + i * 6, BEAT / 2, 2.5))}
              />
            );
          })}

          {/* the towers, rising and then leaning in */}
          {TOWERS.map((t, i) => (
            <TowerSheet
              key={i}
              t={t}
              rise={springIn(g, t0 + 2 + i * 3, { damping: 13, stiffness: 55 })}
              lit={ramp(lit, i * 0.05, 1, 0, 1)}
              lean={t.lean * leanOn * (1 + 0.35 * Math.sin(g * 0.02 + i))}
            />
          ))}

          {/* the street, a narrow strip of paper at the very bottom */}
          <Paper d={tornRect({ x: -60, y: 1020, w: 2040, h: 200, top: 8, bottom: 0, left: 0, right: 0, step: 30, seed: 71 })} fill={mix(C.ink1, C.black, 0.35)} shadow="none" tex={0.5} rim={mix(C.gold, C.black, 0.5)} />

          {/* lamp post + the small figure */}
          <g transform="translate(1120 1020)">
            <Paper d={P([[-5, 0], [5, 0], [4, -330], [-4, -330]])} fill={mix(C.ink1, C.kraft2, 0.2)} shadow="none" tex={0.3} />
            <Paper d={P([[-34, -334], [34, -334], [26, -370], [-26, -370]])} fill={mix(C.gold, C.black, 0.35)} shadow="none" tex={0.3} />
            <Glow x={0} y={-350} r={150} fill="url(#glWarm)" opacity={0.35 + 0.2 * pulse(g, BEAT, 2)} />
          </g>

          {/* light cone from the gap onto the figure */}
          <g opacity={lightCone}>
            <Paper
              d={P([[VPX - 40, VPY + 40], [VPX + 40, VPY + 40], [1050, 1020], [700, 1020]])}
              fill={mix(C.gold2, C.paper, 0.4)}
              opacity={0.1}
              shadow="none"
              tex={0}
            />
          </g>

          <Figure h={130} x={880} y={1022} fill="#080603" pose={look > 0.5 ? 'stand' : 'stand'} rim={mix(C.gold, C.black, 0.3)} />

          {/* the 囍 drifting down */}
          <g transform={`translate(${VPX + 10} ${xiY}) rotate(${xiSpin}) scale(${xiScale})`} opacity={clamp(xi * 3)}>
            <Paper d={tornRect({ x: -80, y: -80, w: 160, h: 160, top: 3, bottom: 3, left: 3, right: 3, step: 14, seed: 91 })} fill={C.red} shadow="soft" tex={0.35} />
            <PaperChar text="囍" size={112} fill={mix(C.redDeep, C.black, 0.2)} />
          </g>

          <Vignette opacity={0.9} />
          <GrainOverlay opacity={0.17} dust={0.24} />
        </Camera>

        <Wash color={mix(C.ink1, C.black, 0.5)} opacity={0.06 + 0.1 * (1 - dim)} blend="multiply" />
        <Wash color={C.amber} opacity={0.07} blend="screen" />
        <Wash color={C.black} opacity={ramp(frame, at(116.6), at(117.42), 0, 0.5)} blend="normal" />
      </Svg>
    </AbsoluteFill>
  );
};
