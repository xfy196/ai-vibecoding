import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { clamp, easeInOut, lerp, pulse, ramp, rampEased, rng, springIn } from '../anim';
import { Camera, Glow, GrainOverlay, Paper, Svg, Vignette, Wash } from '../paper/Paper';
import { P, blob, tornRect } from '../paper/edges';
import { Figure, Lantern, Sparkle } from '../paper/figures';
import { BEAT, C, FPS, light, mix } from '../theme';

/**
 * ⑦ 极低地平线 — 3:08.80–3:43.82　「那些美梦 没给你 我一生有愧」
 *
 * The horizon sits at 88 % height: almost the whole frame is night sky. From a
 * rooftop, sky lanterns lift away — one per beat, each one a wish he never
 * managed to hand over. One of them opens in mid air and shows a lit window
 * inside, then closes and keeps rising.
 */

const T = 188.8;
const at = (sec: number) => Math.round((sec - T) * FPS);

interface LanternSpec {
  x: number;
  delay: number;
  speed: number;
  scale: number;
  drift: number;
  warm: boolean;
}

const LANTERNS: LanternSpec[] = new Array(52).fill(0).map((_, i) => {
  const r = rng(11000 + i);
  return {
    x: 60 + r() * 1800,
    delay: r() * 1500,
    speed: 0.5 + r() * 1.1,
    scale: 0.34 + r() * 1.35,
    drift: (r() - 0.5) * 120,
    warm: r() > 0.25,
  };
});

export const Shot07: React.FC<{ t0: number }> = ({ t0 }) => {
  const frame = useCurrentFrame();
  const g = frame + t0;

  // camera: tilt up and push in a little, following the third lantern
  const tilt = rampEased(frame, 0, at(223.8), 0, 150, easeInOut);
  const camScale = 1 + 0.05 * ramp(frame, 0, 1051);

  // the sky sheet is peeled up by the wind on "假如我年少有为知进退"
  const peel = rampEased(frame, at(203.08), at(206), 0, 1, easeInOut);
  // the distant city turns wedding red
  const redden = rampEased(frame, at(211.8), at(215.5), 0, 1, easeInOut);
  // the hero lifts his hand on "才不会让你替我受罪"
  const handUp = rampEased(frame, at(207.64), at(209.4), 0, 1, easeInOut);
  const handDown = rampEased(frame, at(214.9), at(216.4), 0, 1, easeInOut);
  const arm = handUp * (1 - handDown);

  // the one lantern that opens
  const openK = rampEased(frame, at(193.12), at(194.4), 0, 1, easeInOut);
  const closeK = rampEased(frame, at(196.4), at(197.6), 0, 1, easeInOut);
  const doors = openK * (1 - closeK);

  const dark = ramp(frame, at(220.6), at(223.82), 0, 0.55);

  return (
    <AbsoluteFill style={{ backgroundColor: '#060913' }}>
      <Svg>
        <defs>
          <linearGradient id="s7sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0a1024" />
            <stop offset="45%" stopColor="#17264a" />
            <stop offset="78%" stopColor="#2c3f6b" />
            <stop offset="100%" stopColor="#54405c" />
          </linearGradient>
          <linearGradient id="s7city" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={mix(C.gold, C.amber, 0.4)} stopOpacity="0.75" />
            <stop offset="100%" stopColor={mix(C.amber, C.red, 0.3)} stopOpacity="0" />
          </linearGradient>
        </defs>

        <Camera scale={camScale} y={tilt}>
          {/* sky */}
          <g transform={`rotate(${-peel * 2.2} 960 1080)`}>
            <rect x={-100} y={-100} width={2120} height={1280} fill="url(#s7sky)" />
            {/* a second sky sheet lifting away at its top-left corner */}
            <g opacity={peel * 0.7}>
              <Paper d={P([[-40, -40], [1000, -40], [1040, 700], [-40, 520]])} fill={mix(C.ink2, C.ink3, 0.4)} shadow="soft" tex={0.5} />
            </g>
          </g>

          {/* stars */}
          {new Array(70).fill(0).map((_, i) => {
            const r = rng(12000 + i);
            return <circle key={i} cx={r() * 1920} cy={r() * 780} r={0.9 + r() * 1.9} fill={C.paper} opacity={0.2 + r() * 0.6 * (0.6 + 0.4 * pulse(g + i * 3, BEAT * 2, 2))} />;
          })}
          {new Array(9).fill(0).map((_, i) => {
            const r = rng(12300 + i);
            return <Sparkle key={i} x={r() * 1920} y={60 + r() * 620} r={6 + r() * 14} fill={C.paper} opacity={0.25 + 0.5 * r() * (0.5 + 0.5 * pulse(g + i * 9, BEAT, 2))} />;
          })}

          {/* city glow on the horizon */}
          <rect x={0} y={780} width={1920} height={260} fill="url(#s7city)" opacity={0.55 + 0.45 * redden} />
          <rect x={0} y={780} width={1920} height={260} fill={C.red} opacity={0.25 * redden} style={{ mixBlendMode: 'screen' }} />

          {/* distant skyline, two paper layers */}
          {[0, 1].map((layer) => (
            <g key={layer} opacity={0.75 - layer * 0.25}>
              {new Array(16).fill(0).map((_, i) => {
                const r = rng(13000 + layer * 500 + i);
                const w = 70 + r() * 140;
                const h = 40 + r() * 150 + layer * 30;
                return (
                  <g key={i}>
                    <Paper d={tornRect({ x: i * 124 - 40 + layer * 30, y: 900 - h, w, h, top: 3, bottom: 0, left: 3, right: 3, step: 24, seed: 13400 + i + layer * 60 })} fill={mix(C.ink1, C.ink2, 0.5 + layer * 0.3)} shadow="none" tex={0.4} rim={mix(C.gold, C.ink1, 0.6)} rimWidth={1.5} />
                    {new Array(3).fill(0).map((__, k) => {
                      const lit = r();
                      if (lit < 0.45) return null;
                      return <rect key={k} x={i * 124 - 10 + layer * 30 + k * 26} y={900 - h + 30 + k * 12} width={10} height={8} fill={redden > 0.4 ? C.red2 : C.gold2} opacity={0.35 + 0.5 * redden} />;
                    })}
                  </g>
                );
              })}
            </g>
          ))}

          {/* sky lanterns */}
          {LANTERNS.map((l, i) => {
            const t = (frame + l.delay) * l.speed * 0.55;
            const y = 1120 - ((t + i * 40) % 1500);
            const visible = y > -200 && y < 1140;
            if (!visible) return null;
            const x = l.x + Math.sin((g + i * 60) * 0.008) * 30 + l.drift * (1 - y / 1120);
            const fadeTop = clamp((y + 200) / 300);
            return (
              <g key={i} opacity={fadeTop * (0.78 + 0.22 * Math.min(1, l.scale))}>
                <Lantern
                  h={120 * l.scale}
                  x={x}
                  y={y}
                  rot={Math.sin((g + i * 20) * 0.01) * 4}
                  body={l.warm ? mix(C.gold2, C.amber, 0.35) : mix(C.paper2, C.gold, 0.3)}
                  glow={l.warm ? C.gold3 : C.gold2}
                  lit={0.6 + 0.4 * pulse(g + i * 7, BEAT, 2)}
                  opacity={0.9}
                />
              </g>
            );
          })}

          {/* the lantern that opens: it hangs still in the middle of the sky */}
          <g transform={`translate(880 ${560 - 40 * openK})`}>
            <Glow x={0} y={-60} r={220 + 90 * doors} fill="url(#glWarm)" opacity={0.5} />
            <Lantern h={150} body={mix(C.gold2, C.paper, 0.4)} glow={C.paper} lit={1} y={0} />
            {/* its two paper doors swing open onto a lit window */}
            <g opacity={doors}>
              <rect x={-40} y={-128} width={80} height={92} fill={mix(C.gold2, C.paper, 0.5)} opacity={0.9} />
              <rect x={-4} y={-128} width={6} height={92} fill={mix(C.amber, C.wood, 0.4)} />
              <rect x={-40} y={-92} width={80} height={6} fill={mix(C.amber, C.wood, 0.4)} />
            </g>
            <g opacity={doors * 0.9}>
              <path d={P([[-52, 0], [-40, 0], [-62, -120], [-74, -120]])} fill={mix(C.gold2, C.amber, 0.4)} />
              <path d={P([[52, 0], [40, 0], [62, -120], [74, -120]])} fill={mix(C.gold2, C.amber, 0.4)} />
            </g>
          </g>

          {/* the rooftop: railing, water tank, and him */}
          <g transform="translate(0 950)">
            {/* the roof slab */}
            <Paper d={tornRect({ x: -60, y: 0, w: 2040, h: 200, top: 8, bottom: 0, left: 0, right: 0, step: 30, seed: 301 })} fill={mix(C.ink1, C.ink2, 0.35)} shadow="soft" tex={0.55} rim={mix(C.gold, C.ink1, 0.55)} rimWidth={2} />
            {/* railing */}
            {new Array(19).fill(0).map((_, i) => (
              <rect key={i} x={40 + i * 104} y={-96} width={6} height={96} fill={mix(C.ink1, C.black, 0.35)} opacity={0.95} />
            ))}
            <rect x={-20} y={-100} width={1960} height={9} fill={mix(C.ink1, C.black, 0.3)} opacity={0.95} />
            {/* water tank */}
            <g transform="translate(1580 0)">
              <Paper d={P([[-70, 0], [70, 0], [70, -120], [-70, -120]])} fill={mix(C.ink2, C.kraft2, 0.25)} shadow="mid" tex={0.5} />
              <Paper d={P([[-78, -120], [78, -120], [40, -150], [-40, -150]])} fill={mix(C.ink1, C.black, 0.3)} shadow="near" tex={0.4} />
            </g>
            {/* him, with his back to us, hand raised or not */}
            <Figure h={230} x={1240} y={-10} fill="#05070c" pose={arm > 0.35 ? 'reach' : 'stand'} rim={mix(C.gold, C.ink1, 0.4)} shadow="none" />
          </g>

          <Vignette opacity={0.95} />
          <GrainOverlay opacity={0.16} dust={0.24} />
        </Camera>

        <Wash color={mix(C.ink1, C.black, 0.5)} opacity={0.2} blend="multiply" />
        <Wash color={C.black} opacity={dark} blend="normal" />
      </Svg>
    </AbsoluteFill>
  );
};
