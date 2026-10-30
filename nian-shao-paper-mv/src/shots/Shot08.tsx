import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { clamp, easeInOut, lerp, pulse, ramp, rampEased, rng, springIn } from '../anim';
import { Camera, Glow, GrainOverlay, Paper, Svg, Vignette, Wash } from '../paper/Paper';
import { P, rrect, tornRect } from '../paper/edges';
import { Chair, Coin, Figure, Glass, PaperChar, Scrap, Table } from '../paper/figures';
import { BEAT, C, FPS, light, mix } from '../theme';

/**
 * ⑧ 前景巨物 — 3:43.82–4:14.22　「金钱地位 搏到了 却好想退回」
 *
 * The wedding, from the table. A giant glass fills the near corner of the frame
 * and sways; behind it the hall: round tables, paper guests, a cake, and a wall
 * of red 囍. Money falls, silently, like confetti he is not allowed to pick up.
 * On the last line the glass is raised and the red sheet comes down over
 * everything.
 */

const T = 223.82;
const at = (sec: number) => Math.round((sec - T) * FPS);

interface Guest {
  x: number;
  y: number;
  h: number;
  flip: boolean;
  seed: number;
}

const GUESTS: Guest[] = [
  { x: 300, y: 700, h: 96, flip: false, seed: 1 },
  { x: 480, y: 706, h: 92, flip: true, seed: 2 },
  { x: 660, y: 698, h: 100, flip: false, seed: 3 },
  { x: 820, y: 706, h: 88, flip: true, seed: 4 },
  { x: 1120, y: 702, h: 96, flip: false, seed: 5 },
  { x: 1300, y: 708, h: 92, flip: true, seed: 6 },
  { x: 1480, y: 700, h: 100, flip: false, seed: 7 },
  { x: 260, y: 880, h: 130, flip: true, seed: 8 },
  { x: 560, y: 890, h: 136, flip: false, seed: 9 },
  { x: 1480, y: 886, h: 132, flip: true, seed: 10 },
  { x: 1700, y: 894, h: 128, flip: false, seed: 11 },
];

export const Shot08: React.FC<{ t0: number }> = ({ t0 }) => {
  const frame = useCurrentFrame();
  const g = frame + t0;

  // camera rises off the table; the glass sways with the room
  const rise = rampEased(frame, 0, at(254), 0, -96, easeInOut);
  const sway = Math.sin(g * 0.021) * 1.3 + Math.sin(g * 0.009) * 0.6;
  const camScale = 1 + 0.03 * ramp(frame, 0, 760);

  const redIn = rampEased(frame, at(223.82), at(226.4), 0, 1, easeInOut);
  const litUp = rampEased(frame, at(223.82), at(230), 0.3, 1, easeInOut);

  // the money rain on "金钱地位"
  const coinT = rampEased(frame, at(228.58), at(231.6), 0, 1, easeInOut);
  const coinsSettled = frame > at(231.6);

  // heads turn towards the couple
  const turn = rampEased(frame, at(235.8), at(237.4), 0, 1, easeInOut);

  // the couple, lit up in the middle distance
  const couple = rampEased(frame, at(240.38), at(242.4), 0, 1, easeInOut);

  // the glass is raised on the last line
  const raise = rampEased(frame, at(244.54), at(248.4), 0, 1, easeInOut);
  const cover = rampEased(frame, at(251.6), at(254.2), 0, 1, easeInOut);

  return (
    <AbsoluteFill style={{ backgroundColor: '#1c0507' }}>
      <Svg>
        <defs>
          <linearGradient id="s8hall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={mix(C.redDeep, C.black, 0.35)} />
            <stop offset="55%" stopColor={mix(C.red3, C.redDeep, 0.35)} />
            <stop offset="100%" stopColor={mix(C.redDeep, C.black, 0.5)} />
          </linearGradient>
          <radialGradient id="s8glow" cx="0.5" cy="0.42" r="0.6">
            <stop offset="0%" stopColor={C.gold2} stopOpacity="0.85" />
            <stop offset="60%" stopColor={C.amber} stopOpacity="0.22" />
            <stop offset="100%" stopColor={C.red3} stopOpacity="0" />
          </radialGradient>
        </defs>

        <Camera scale={camScale} y={rise}>
          {/* the hall */}
          <rect width={1920} height={1080} fill="url(#s8hall)" />
          <Glow x={960} y={430} r={900} fill="url(#s8glow)" opacity={0.35 + 0.5 * litUp} />

          {/* the wall of 囍: a red sheet with the character cut out of it */}
          <g transform={`translate(960 350) scale(${0.9 + 0.1 * redIn})`}>
            <Paper d={tornRect({ x: -230, y: -230, w: 460, h: 460, top: 6, bottom: 6, left: 6, right: 6, step: 26, seed: 801 })} fill={mix(C.red, C.redDeep, 0.25)} shadow="soft" tex={0.5} edge={light(C.red, 0.2)} />
            <g opacity={0.95}>
              <PaperChar text="囍" size={380} fill={mix(C.gold2, C.paper, 0.35)} />
            </g>
            <PaperChar text="囍" size={380} fill={mix(C.redDeep, C.black, 0.3)} opacity={0.25} />
          </g>

          {/* five chandeliers */}
          {[0, 1, 2, 3, 4].map((i) => {
            const cx = 360 + i * 300;
            const cy = 70 + (i % 2) * 26;
            return (
              <g key={i} transform={`translate(${cx} ${cy})`}>
                <Paper d={P([[-2, 0], [2, 0], [2, 60], [-2, 60]])} fill={mix(C.redDeep, C.black, 0.4)} shadow="none" tex={0.2} />
                <Paper d={P([[-64, 60], [64, 60], [44, 112], [-44, 112]])} fill={mix(C.gold2, C.paper, 0.4)} shadow="near" tex={0.3} />
                <Glow x={0} y={104} r={220} fill="url(#glWarm)" opacity={0.4 * litUp} />
              </g>
            );
          })}

          {/* tables, back to front */}
          {[
            { y: 620, w: 210, n: 6 },
            { y: 760, w: 280, n: 5 },
            { y: 930, w: 360, n: 4 },
          ].map((row, ri) => (
            <g key={ri}>
              {new Array(row.n).fill(0).map((_, i) => {
                const x = 190 + i * ((1600 - 190) / Math.max(1, row.n - 1)) + (ri % 2) * 40;
                return (
                  <g key={i}>
                    <Table w={row.w} h={row.w * 0.3} x={x} y={row.y} cloth={mix(C.paper, C.red3, 0.35)} top={mix(C.paper2, C.gold, 0.2)} shadow="mid" />
                    {/* glasses and plates on the cloth */}
                    {new Array(4).fill(0).map((__, k) => (
                      <rect key={k} x={x - row.w * 0.32 + k * row.w * 0.21} y={row.y - 8} width={12} height={16} rx={3} fill={mix(C.ice, C.paper, 0.4)} opacity={0.75} />
                    ))}
                  </g>
                );
              })}
            </g>
          ))}

          {/* chairs behind the far tables */}
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <Chair key={i} h={90} x={260 + i * 230} y={640} fill={mix(C.redDeep, C.black, 0.2)} shadow="none" rot={-2 + (i % 3) * 2} />
          ))}

          {/* the guests: paper silhouettes, heads turning */}
          {GUESTS.map((p, i) => (
            <g key={i}>
              <Figure
                h={p.h}
                x={p.x + turn * (i % 2 === 0 ? -10 : 10)}
                y={p.y}
                fill={mix(C.redDeep, C.black, 0.35)}
                pose="sit"
                flip={p.flip !== turn > 0.6}
                shadow="none"
                rim={mix(C.gold, C.redDeep, 0.55)}
              />
            </g>
          ))}

          {/* the cake, three tiers */}
          <g transform="translate(1080 940)">
            <Paper d={P([[-46, 0], [46, 0], [40, -40], [-40, -40]])} fill={mix(C.paper, C.gold, 0.2)} shadow="mid" tex={0.35} edge={true} />
            <Paper d={P([[-72, -40], [72, -40], [64, -96], [-64, -96]])} fill={mix(C.paper2, C.gold, 0.18)} shadow="mid" tex={0.35} edge={true} />
            <Paper d={P([[-96, -96], [96, -96], [86, -166], [-86, -166]])} fill={mix(C.paper, C.gold, 0.25)} shadow="mid" tex={0.35} edge={true} />
            <PaperChar text="囍" size={44} fill={C.red} y={-130} />
            <Paper d={P([[-4, -166], [4, -166], [3, -206], [-3, -206]])} fill={mix(C.kraft, C.paper2, 0.3)} shadow="none" tex={0.2} />
          </g>

          {/* the couple, small, lit from behind */}
          <g opacity={couple}>
            <Glow x={960} y={700} r={260} fill="url(#glWarm)" opacity={0.5} />
            <Figure h={150} x={920} y={720} fill={mix(C.paper, C.gold2, 0.3)} pose="stand" shadow="none" />
            <Figure h={142} x={1000} y={720} fill={mix(C.paper, C.gold2, 0.2)} pose="stand" flip shadow="none" />
          </g>

          {/* the money, falling with no weight at all */}
          {new Array(30).fill(0).map((_, i) => {
            const r = rng(14000 + i);
            const y0 = -80 - r() * 500;
            const fall = clamp((frame - at(228.58) - r() * 30) / 90);
            if (fall <= 0) return null;
            const y = lerp(y0, 760 + r() * 260, fall);
            const x = 120 + r() * 1700 + Math.sin(fall * 6 + i) * 26;
            return <Coin key={i} r={16 + r() * 12} x={x} y={y} rot={fall * 320 * (r() > 0.5 ? 1 : -1)} fill={mix(C.gold, C.gold2, r())} opacity={0.9 * (1 - fall * 0.15)} />;
          })}
          {coinsSettled
            ? new Array(24).fill(0).map((_, i) => {
                const r = rng(14400 + i);
                return <Coin key={`s${i}`} r={14 + r() * 10} x={120 + r() * 1700} y={800 + r() * 260} rot={r() * 360} fill={mix(C.gold, C.gold2, r())} opacity={0.85} />;
              })
            : null}

          {/* scattered red scraps on the floor */}
          {new Array(14).fill(0).map((_, i) => {
            const r = rng(14600 + i);
            return <Scrap key={i} x={r() * 1900} y={860 + r() * 200} size={10 + r() * 18} fill={mix(C.red2, C.redDeep, r())} seed={14700 + i} rot={r() * 360} opacity={0.7} />;
          })}
        </Camera>

        {/* -------------------------------------------------- foreground: the glass */}
        <g transform={`translate(${430 + Math.sin(g * 0.02) * 8} ${1130 - raise * 420}) rotate(${sway - 6 + raise * 10})`}>
          <Glow x={0} y={-260} r={420} fill="url(#glWarm)" opacity={0.16} />
          <Glass h={780} fill={mix(C.ice, C.paper, 0.35)} liquid={mix(C.redDeep, C.black, 0.4)} liquidTop={0.55} rim={C.ice} opacity={0.92} />
          {/* the paper "wine" inside is a dark disc that turns as the glass does */}
          <g opacity={0.9} transform={`translate(0 -320) rotate(${g * 0.35})`}>
            <ellipse cx={0} cy={0} rx={150} ry={34} fill={mix(C.redDeep, C.black, 0.45)} />
            <ellipse cx={0} cy={-4} rx={150} ry={34} fill={mix(C.red3, C.redDeep, 0.6)} opacity={0.7} />
          </g>
        </g>

        <Vignette opacity={0.9} />
        <GrainOverlay opacity={0.16} dust={0.22} />

        {/* the red sheet comes down over the lens */}
        <g transform={`translate(0 ${lerp(-1200, 0, cover)})`}>
          <Paper d={tornRect({ x: -30, y: -20, w: 1980, h: 1120, top: 20, bottom: 20, left: 0, right: 0, step: 40, seed: 901 })} fill={mix(C.red, C.red3, 0.4)} shadow="deep" tex={0.6} edge={light(C.red, 0.15)} />
        </g>
        <Wash color={C.black} opacity={ramp(frame, at(253.6), at(254.22), 0, 1)} blend="normal" />
      </Svg>
    </AbsoluteFill>
  );
};
