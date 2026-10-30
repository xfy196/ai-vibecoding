import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { clamp, easeInOut, lerp, pulse, ramp, rampEased, rng, shake, springIn, wobble } from '../anim';
import { Camera, Glow, GrainOverlay, Paper, Svg, Vignette, Wash } from '../paper/Paper';
import { P, crackPath, shard, tornRect } from '../paper/edges';
import { Bowl, Chopstick, Scrap, Steam } from '../paper/figures';
import { BEAT, C, FPS, light, mix } from '../theme';

/**
 * ③ 左右对开 — 1:00.56–1:26.78　「墙板被我砸烂 / 一碗热的粥 都留一半带走」
 *
 * One frame, cut down the middle: on the left the wall he smashed, on the right
 * the half bowl of congee she left. On "都留一半带走" the seam itself tears open
 * and the two sheets drift apart — the gap between them is the whole song.
 */

const T = 60.56;
const at = (sec: number) => Math.round((sec - T) * FPS);

const FIST =
  'M-70 60 L-78 -20 C-80 -40 -64 -52 -46 -50 L-40 -110 C-38 -132 -8 -134 -6 -112 L-2 -52 L6 -52 L8 -128 C10 -150 40 -152 42 -130 L46 -52 L56 -52 L58 -118 C60 -140 90 -142 92 -120 L94 -46 C96 -6 86 30 82 60 L80 210 L-66 210 Z';

export const Shot03: React.FC<{ t0: number }> = ({ t0 }) => {
  const frame = useCurrentFrame();
  const g = frame + t0;

  // the hit
  const hit = 1 - clamp(frame / 14);
  const sh = shake(frame, 0, 16, 6);

  // cracks grow out of the impact point
  const crack = rampEased(frame, 0, 22, 0, 1, easeInOut);

  // the fist pulls back out of frame
  const fistOut = rampEased(frame, 4, 26, 0, 300, easeInOut);

  // a flake of plaster lets go on "到现在还没修"
  const flake = rampEased(frame, at(65.36), at(69.0), 0, 460, easeInOut);

  // the right panel slides in, then pushes in towards the bowl
  const slideIn = springIn(g, t0 + 2, { damping: 15, stiffness: 70 });
  const push = rampEased(frame, at(65.36), at(69.9), 1.0, 1.12, easeInOut);

  // the seam tears open on "都留一半带走"
  const open = rampEased(frame, at(69.92), at(70.6), 0, 1, easeInOut);
  const gap = open * 44;

  // a paper moon of "今后" rises out of the gap
  const moonUp = springIn(g, t0 + at(72.26), { damping: 18, stiffness: 45 });
  // "你常常眼睛挥红": a red sheet slides over the moon
  const redOver = rampEased(frame, at(76.72), at(78.6), 0, 1, easeInOut);
  const dim = 1 - 0.35 * ramp(frame, at(76.72), at(80.06));

  // "原来心疼我": the two halves come back together
  const close = rampEased(frame, at(80.06), at(82.4), 0, 1, easeInOut);
  const gapNow = gap * (1 - close);

  // the whole sheet wrinkles as we fall into ④
  const wrinkle = wobble(g, 5, 0.02, 0.6) + ramp(frame, at(83.5), at(86.6), 0, 2.4);

  const camScale = (1 + 0.05 * ramp(frame, 0, 917)) * (1 + 0.012 * hit) * (1 + 0.004 * pulse(g, BEAT, 3));

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0806' }}>
      <Svg>
        <defs>
          <clipPath id="s3L">
            <rect x={-260} y={-260} width={1220} height={1600} />
          </clipPath>
          <clipPath id="s3R">
            <rect x={960} y={-260} width={1220} height={1600} />
          </clipPath>
          <linearGradient id="s3wall" x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0%" stopColor={mix(C.kraft2, C.black, 0.22)} />
            <stop offset="55%" stopColor={mix(C.kraft2, C.black, 0.05)} />
            <stop offset="100%" stopColor={mix(C.kraft2, C.black, 0.3)} />
          </linearGradient>
          <linearGradient id="s3bowl" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={mix(C.paper3, C.amber, 0.18)} />
            <stop offset="100%" stopColor={mix(C.cream, C.amber, 0.28)} />
          </linearGradient>
        </defs>

        <Camera scale={camScale * 1.05} x={sh.x} y={sh.y} rotate={-2 + wrinkle * 0.4}>
          {/* ------------------------------------------------ LEFT: the wall */}
          <g clipPath="url(#s3L)" transform={`translate(${-gapNow} 0)`} opacity={dim}>
            <rect x={-260} y={-260} width={1300} height={1620} fill="url(#s3wall)" />
            <rect x={-260} y={-260} width={1300} height={1620} fill="url(#blotch)" opacity={0.25} style={{ mixBlendMode: 'overlay' }} />

            {/* skirting board + floor seam, so it reads as a room */}
            <Paper d={tornRect({ x: -60, y: 880, w: 1080, h: 220, top: 8, bottom: 0, left: 0, right: 0, step: 26, seed: 12 })} fill={mix(C.wood, C.black, 0.5)} shadow="mid" tex={0.5} edge={light(mix(C.wood, C.black, 0.5), 0.2)} />

            {/* the impact: a torn hole + a web of cracks */}
            <g transform="translate(520 600)">
              <Paper d={shard(140, 120, 31, 11)} fill={C.black} shadow="none" tex={0} opacity={0.95} />
              <g opacity={clamp(crack * 1.4)}>
                {[12, 74, 141, 205, 268, 322].map((a, i) => (
                  <path
                    key={i}
                    d={crackPath(0, 0, 240 + i * 22, a, 26, 40 + i, 7)}
                    stroke="#050403"
                    strokeWidth={7 - i * 0.4}
                    fill="none"
                    strokeLinecap="round"
                    opacity={0.85}
                    strokeDasharray={520}
                    strokeDashoffset={520 * (1 - crack)}
                  />
                ))}
                {[12, 74, 141, 205, 268, 322].map((a, i) => (
                  <path
                    key={`l${i}`}
                    d={crackPath(0, 0, 240 + i * 22, a, 26, 40 + i, 7)}
                    stroke={mix(C.ice, C.cyan, 0.5)}
                    strokeWidth={2.4}
                    fill="none"
                    strokeLinecap="round"
                    opacity={0.35}
                    strokeDasharray={520}
                    strokeDashoffset={520 * (1 - crack)}
                  />
                ))}
              </g>
              {/* light from the street coming through the wound */}
              <Glow x={0} y={0} r={260} fill="url(#glCold)" opacity={0.12 + 0.2 * crack} />
            </g>

            {/* plaster flake letting go */}
            <g transform={`translate(360 ${860 + flake}) rotate(${flake * 0.16})`}>
              <Paper d={shard(120, 90, 77, 8)} fill={mix(C.kraft2, C.paper3, 0.55)} shadow="mid" tex={0.5} edge={true} opacity={0.95} />
            </g>

            {/* the fist that did it, already pulling away */}
            <g transform={`translate(${520 + fistOut * 0.6} ${600 + fistOut * 0.2}) rotate(-18)`} opacity={clamp((26 - frame) / 8)}>
              <Paper d={FIST} fill={mix(C.ink1, C.black, 0.5)} shadow="deep" tex={0.3} />
            </g>

            {/* a few scraps of wall on the floor */}
            {new Array(7).fill(0).map((_, i) => {
              const r = rng(1500 + i);
              return <Scrap key={i} x={120 + r() * 780} y={900 + r() * 120} size={9 + r() * 14} fill={mix(C.kraft2, C.paper3, 0.4)} seed={1600 + i} rot={r() * 360} opacity={0.7} />;
            })}
          </g>

          {/* ------------------------------------------------ RIGHT: the congee */}
          <g clipPath="url(#s3R)" transform={`translate(${(1 - slideIn) * 900 + gapNow} 0)`} opacity={dim}>
            <g transform={`translate(1440 620) scale(${push}) translate(-1440 -620)`}>
              <rect x={860} y={-260} width={1300} height={1620} fill={mix(C.cream, C.amber, 0.12)} />
              <rect x={860} y={-260} width={1300} height={1620} fill="url(#blotch)" opacity={0.3} style={{ mixBlendMode: 'multiply' }} />
              {/* warm pool of lamp light behind the bowl */}
              <Glow x={1560} y={430} r={620} fill="url(#glWarm)" opacity={0.35} />
              {/* the table */}
              <Paper d={tornRect({ x: 900, y: 700, w: 1120, h: 400, top: 10, bottom: 0, left: 0, right: 0, step: 28, seed: 91 })} fill={mix(C.wood, C.amber, 0.28)} shadow="mid" tex={0.55} edge={light(mix(C.wood, C.amber, 0.28), 0.25)} />
              {/* the bowl, only half full */}
              <g transform="translate(1440 700)">
                <ellipse cx={0} cy={4} rx={230} ry={30} fill="#000" opacity={0.28} />
                <Bowl w={440} fill="url(#s3bowl)" amount={0.5} y={-4} />
                <Chopstick len={420} fill={mix(C.wood, C.paper3, 0.3)} x={-60} y={-70} rot={-9} />
                <Chopstick len={400} fill={mix(C.wood, C.paper3, 0.3)} x={-46} y={-46} rot={-6} />
                <Steam x={0} y={-96} t={g * 0.9} scale={1.25} count={4} opacity={0.5} />
              </g>
              {/* her hand, paper, resting on the table edge (only the sleeve) */}
              <g transform="translate(1680 860) rotate(6)" opacity={0.9}>
                <Paper d={P([[0, 0], [200, -20], [260, 90], [40, 130]])} fill={mix(C.paper2, C.amber, 0.2)} shadow="mid" tex={0.4} edge={true} />
              </g>
            </g>
          </g>

          {/* ------------------------------------------------ the seam itself */}
          <g>
            <rect x={960 - 3 - gapNow} y={0} width={6 + gapNow * 2} height={1080} fill={C.black} />
            <rect x={960 - 4 - gapNow} y={0} width={2.5} height={1080} fill={mix(C.paper3, C.amber, 0.3)} opacity={0.5} />
            <rect x={960 + 1.5 + gapNow} y={0} width={2.5} height={1080} fill={mix(C.paper3, C.amber, 0.3)} opacity={0.5} />
            {/* scraps flying out of the gap when it tears */}
            {open > 0.05
              ? new Array(6).fill(0).map((_, i) => {
                  const r = rng(2200 + i);
                  const prog = ramp(frame, at(69.92) + i * 3, at(71.4) + i * 4);
                  return <Scrap key={i} x={960 + (r() - 0.5) * 260 * prog} y={380 + r() * 460 + prog * 120} size={8 + r() * 12} fill={mix(C.paper3, C.amber, 0.4)} seed={2300 + i} rot={prog * 260 * r()} opacity={0.8 * (1 - prog * 0.7)} />;
                })
              : null}
          </g>

          {/* ------------------------------------------------ the moon in the gap */}
          <g opacity={clamp(moonUp * 1.3)} transform={`translate(960 ${520 + (1 - moonUp) * 220})`}>
            <Glow x={0} y={0} r={300} fill="url(#glWarm)" opacity={0.4} />
            <Paper d={`M-86 0 A86 86 0 1 1 86 0 A86 86 0 1 1 -86 0 Z`} fill={mix(C.gold2, C.paper, 0.35)} shadow="soft" tex={0.3} edge={true} />
            {/* the red sheet that covers its lower half on "眼睛挥红" */}
            <g transform={`translate(0 ${lerp(200, 8, redOver)})`}>
              <Paper d={tornRect({ x: -120, y: 0, w: 240, h: 220, top: 8, bottom: 40, left: 0, right: 0, step: 18, seed: 55 })} fill={C.red} shadow="mid" tex={0.4} edge={light(C.red, 0.2)} />
            </g>
          </g>

          <Vignette opacity={0.85} />
          <GrainOverlay opacity={0.18} dust={0.22} />
        </Camera>

        {/* the sheet wrinkles and dims into ④ */}
        <Wash color={mix(C.ink1, C.black, 0.4)} opacity={ramp(frame, at(83.6), at(86.7), 0, 0.75)} blend="multiply" />
        <Wash color={C.black} opacity={ramp(frame, at(86.4), at(86.78), 0, 0.55)} blend="normal" />
      </Svg>
    </AbsoluteFill>
  );
};
