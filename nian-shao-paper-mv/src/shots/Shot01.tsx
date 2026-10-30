import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { clamp, easeInOut, lerp, pulse, ramp, rampEased, rng, springIn } from '../anim';
import { Camera, Glow, GrainOverlay, Paper, Svg, Vignette, Wash } from '../paper/Paper';
import { P, tornRect } from '../paper/edges';
import { PaperChar } from '../paper/figures';
import { BEAT, C, light, mix } from '../theme';

/**
 * ① 窗阵隧道 — 0:00–0:30
 *
 * The camera pushes down a corridor of stacked paper façades. Eight sheets, each
 * one a wall of cut windows with a single big opening in the middle, each hole
 * one block deeper, brighter and warmer than the last. Behind the final opening
 * a television is already flickering. The title is a cream paper banner that
 * slides in, gets its characters stamped on, and lifts away before the first
 * lyric line.
 */

const CX = 960;
const CY = 500;
const RINGS = 8;
const K = 0.815;

const WALL_W = 2900;
const WALL_H = 1900;

/** One block of the corridor: a wall of windows with a punched opening. */
const Facade: React.FC<{ i: number; lit: number; flick: number }> = ({ i, lit, flick }) => {
  const k = Math.pow(K, i);
  const hw = 1560 * k;
  const hh = 900 * k;
  const x0 = CX - hw / 2;
  const y0 = CY - hh / 2;

  const wall = P([[-WALL_W / 2, -WALL_H / 2], [WALL_W / 2, -WALL_H / 2], [WALL_W / 2, WALL_H / 2], [-WALL_W / 2, WALL_H / 2]]) +
    ' ' +
    P([[x0 - CX, y0 - CY], [x0 - CX + hw, y0 - CY], [x0 - CX + hw, y0 - CY + hh], [x0 - CX, y0 - CY + hh]]);

  const depth = i / (RINGS - 1);
  const fill = mix(mix(C.ink1, C.ink2, 0.5 + depth * 0.35), C.ink3, depth * 0.3);

  const r = rng(900 + i * 17);
  const panels: React.ReactNode[] = [];
  const cols = 5;
  const rows = 4;
  const pw = 470;
  const ph = 300;
  const gx = 540;
  const gy = 400;
  for (let c = 0; c < cols; c++) {
    for (let rw = 0; rw < rows; rw++) {
      const px = -CX + (c - (cols - 1) / 2) * gx - pw / 2;
      const py = -CY + (rw - (rows - 1) / 2) * gy - ph / 2;
      // skip whatever falls inside the big opening
      const insideX = px + pw > x0 - CX && px < x0 - CX + hw;
      const insideY = py + ph > y0 - CY && py < y0 - CY + hh;
      if (insideX && insideY) continue;
      const seedv = r();
      if (seedv > 0.86) continue;
      const onAt = 0.05 + seedv * 0.85;
      const on = clamp((lit - onAt) * 6);
      const warm = seedv > 0.4;
      const col = warm ? C.gold2 : C.ice;
      panels.push(
        <g key={`${c}-${rw}`} transform={`translate(${px} ${py})`}>
          <rect width={pw} height={ph} fill={mix(C.black, C.ink1, 0.6)} opacity={0.85} />
          {on > 0.02 ? (
            <>
              <rect width={pw} height={ph} fill={col} opacity={0.25 + 0.6 * on} />
              <rect width={pw} height={ph} fill={col} opacity={0.3 * on} style={{ mixBlendMode: 'screen' }} />
              <rect x={pw / 2 - 4} width={8} height={ph} fill={mix(C.ink1, C.black, 0.4)} opacity={0.75} />
              <rect y={ph * 0.5 - 4} width={pw} height={8} fill={mix(C.ink1, C.black, 0.4)} opacity={0.75} />
              <rect x={pw / 2 - 4} width={2} height={ph} fill={mix(col, C.white, 0.5)} opacity={0.5 * on} />
            </>
          ) : (
            <rect width={pw} height={ph} fill={mix(C.black, C.ink1, 0.35)} opacity={0.5} />
          )}
        </g>,
      );
    }
  }

  return (
    <g transform={`translate(${CX} ${CY}) scale(${k})`}>
      <g>
        <Paper d={wall} fillRule="evenodd" fill={fill} shadow="none" tex={0.55} />
        {/* the cut has thickness: a black lip and a lit top edge */}
        <rect x={x0 - CX - 6} y={y0 - CY - 6} width={hw + 12} height={hh + 12} fill="none" stroke={mix(C.black, C.ink1, 0.3)} strokeWidth={26} opacity={0.95} />
        <rect x={x0 - CX} y={y0 - CY} width={hw} height={hh} fill="none" stroke={light(fill, 0.3)} strokeWidth={3} opacity={0.55} />
        {panels}
        {/* the deepest opening glows with the television behind it */}
        {i === RINGS - 1 ? (
          <g>
            <rect x={x0 - CX} y={y0 - CY} width={hw} height={hh} fill="#060b12" />
            <ellipse cx={0} cy={8} rx={hw * 0.6} ry={hh * 0.55} fill={C.ice} opacity={0.2 + 0.8 * flick} style={{ mixBlendMode: 'screen' }} />
            <Paper
              d={P([
                [-hw * 0.22, -hh * 0.16],
                [hw * 0.22, -hh * 0.16],
                [hw * 0.22, hh * 0.2],
                [-hw * 0.22, hh * 0.2],
              ])}
              fill={mix(C.ice, C.white, 0.5 * flick)}
              opacity={0.35 + 0.6 * flick}
            />
            <rect x={-hw * 0.22} y={hh * 0.2} width={hw * 0.44} height={hh * 0.05} fill={mix(C.ink1, C.black, 0.4)} />
          </g>
        ) : null}
      </g>
    </g>
  );
};

export const Shot01: React.FC<{ t0: number }> = ({ t0 }) => {
  const frame = useCurrentFrame();
  const g = frame + t0;

  const push = rampEased(frame, 0, 900, 1.0, 1.34, easeInOut);
  const camScale = push * (1 + 0.008 * pulse(g, BEAT, 3));

  const litProgress = ramp(frame, 0, 780, 0.26, 1);
  const flick = frame > 700 ? (Math.sin(frame * 3.7) > 0 ? 1 : 0.2) : 0.55 + 0.15 * pulse(g, BEAT, 2);

  const bannerIn = springIn(g, t0 + 150, { damping: 15, stiffness: 85 });
  const bannerOut = rampEased(frame, 402, 444, 0, -700, easeInOut);
  const chars = '年少有为';
  const stamp = (i: number) => springIn(g, t0 + 176 + i * 13, { damping: 12, stiffness: 170 });
  const cover = rampEased(frame, 0, 26, 0, -1150, easeInOut);
  const flash = ramp(frame, 872, 894, 0, 1);

  return (
    <AbsoluteFill style={{ backgroundColor: '#04070c' }}>
      <Svg>
        <defs>
          <linearGradient id="s1sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#02050a" />
            <stop offset="50%" stopColor="#08111b" />
            <stop offset="100%" stopColor="#101d29" />
          </linearGradient>
        </defs>

        <Camera scale={camScale}>
          <rect width={1920} height={1080} fill="url(#s1sky)" />
          {new Array(RINGS)
            .fill(0)
            .map((_, i) => RINGS - 1 - i)
            .map((i) => (
              <Facade key={i} i={i} lit={ramp(litProgress, i * 0.04, 1, 0, 1)} flick={flick} />
            ))}

          <Glow x={CX} y={CY} r={560} fill="url(#glCold)" opacity={0.12 + 0.3 * flick} />

          {/* paper dust drifting down the corridor */}
          {new Array(18).fill(0).map((_, i) => {
            const r = rng(300 + i);
            const px = r() * 1920;
            const py = ((r() * 1200 + g * (0.5 + r() * 1.8)) % 1200) - 60;
            const size = 3 + r() * 7;
            return (
              <rect
                key={i}
                x={px}
                y={py}
                width={size}
                height={size * 0.8}
                fill={C.ice}
                opacity={0.12 + 0.22 * r()}
                transform={`rotate(${(g * (0.2 + r()) + i * 40).toFixed(1)} ${px} ${py})`}
              />
            );
          })}

          {/* title: a cream sheet with the characters stamped into it */}
          <g transform={`translate(0 ${(1 - clamp(bannerIn)) * -120 + bannerOut})`} opacity={clamp(bannerIn * 1.5)}>
            <g transform="rotate(-1.1)">
              <Paper
                d={tornRect({ x: 150, y: 400, w: 1620, h: 256, top: 10, bottom: 12, left: 6, right: 6, step: 26, seed: 61 })}
                fill={C.paper}
                shadow="soft"
                tex={0.5}
                edge={light(C.paper, 0.18)}
              />
              {chars.split('').map((ch, i) => (
                <g key={i} transform={`translate(${500 + i * 232} 528) scale(${lerp(1.35, 1, clamp(stamp(i)))})`} opacity={clamp(stamp(i) * 1.6)}>
                  <PaperChar text={ch} size={196} fill="#12181f" weight={700} family={'"STKaiti","KaiTi","SimSun",serif'} />
                </g>
              ))}
              <g transform="translate(1560 596) rotate(-4)" opacity={clamp(ramp(frame, 296, 316))}>
                <Paper d={tornRect({ x: -48, y: -48, w: 96, h: 96, top: 3, bottom: 3, left: 3, right: 3, step: 12, seed: 71 })} fill={C.red} shadow="near" tex={0.3} />
                <PaperChar text="李" size={58} fill={C.paper} y={2} />
              </g>
              <g opacity={clamp(ramp(frame, 216, 258))}>
                <PaperChar text="李荣浩" size={56} fill={mix(C.ink1, C.slate, 0.45)} x={330} y={528} />
                <PaperChar text="作词 / 作曲 / 编曲" size={28} fill={mix(C.ink1, C.slate, 0.6)} x={1595} y={636} />
                <PaperChar text="层叠剪纸 MV" size={28} fill={mix(C.ink1, C.slate, 0.6)} x={1595} y={678} />
              </g>
            </g>
          </g>

          <Vignette opacity={0.9} />
          <GrainOverlay opacity={0.16} dust={0.22} />
        </Camera>

        {/* the opening sheet lifting away */}
        <g transform={`translate(0 ${cover})`}>
          <Paper
            d={tornRect({ x: -20, y: -8, w: 1960, h: 1096, top: 16, bottom: 16, left: 0, right: 0, step: 40, seed: 5 })}
            fill={C.paper2}
            shadow="deep"
            tex={0.5}
          />
        </g>

        <Wash color={C.white} opacity={flash} blend="normal" />
      </Svg>
    </AbsoluteFill>
  );
};
