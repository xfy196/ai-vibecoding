import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { clamp, easeInOut, lerp, pulse, ramp, rampEased, rng, wobble } from '../anim';
import { Camera, Glow, GrainOverlay, Paper, Svg, Vignette, Wash } from '../paper/Paper';
import { P, tornRect } from '../paper/edges';
import { Figure } from '../paper/figures';
import { BEAT, C, FPS, light, mix } from '../theme';

/**
 * ⑤ 雨窗微距 — 1:57.42–2:25.58　（间奏）
 *
 * Extreme close-up on a window at night. What slides down the glass is not
 * water but strips of paper, cut at different widths, each running at its own
 * speed. The city behind is only bokeh discs. At 2:20 a figure crosses outside
 * the glass; the street lamp blinks, and for a moment two silhouettes are
 * reflected in it.
 */

const T = 117.42;
const at = (sec: number) => Math.round((sec - T) * FPS);

interface Strip {
  x: number;
  w: number;
  len: number;
  speed: number;
  delay: number;
  op: number;
}

const STRIPS: Strip[] = new Array(46).fill(0).map((_, i) => {
  const r = rng(7700 + i);
  return {
    x: r() * 1920,
    w: 2.5 + r() * 6,
    len: 55 + r() * 190,
    speed: 0.5 + r() * 2.4,
    delay: r() * 1400,
    op: 0.25 + r() * 0.5,
  };
});

export const Shot05: React.FC<{ t0: number }> = ({ t0 }) => {
  const frame = useCurrentFrame();
  const g = frame + t0;

  // camera: a slow breath to the left
  const camX = rampEased(frame, 0, 844, 30, -80, (x) => x);
  const scale = 1.04 + 0.02 * pulse(g, BEAT, 3);

  // the one tear that stops half way down
  const slow = 1 - 0.85 * rampEased(frame, at(126), at(130), 0, 1, easeInOut);
  const stopStrip = rampEased(frame, at(126), at(132), 0, 1, easeInOut);

  // the figure passing outside at 2:13.6
  const pass = rampEased(frame, at(133.6), at(135.4), -260, 2160, (x) => x);
  const passOp = clamp(1 - Math.abs((pass - 950) / 1300));

  // the lamp blinks at 2:20
  const blink = frame > at(140) && frame < at(140.35) ? 0.15 : 1;
  const refl = rampEased(frame, at(140.4), at(143), 0, 1, easeInOut);

  // rain hits the cut at the end
  const rush = rampEased(frame, at(144.6), at(146.6), 0, 1, easeInOut);
  const dark = ramp(frame, at(144.8), at(145.58), 0, 1);

  return (
    <AbsoluteFill style={{ backgroundColor: '#04080d' }}>
      <Svg>
        <defs>
          <linearGradient id="s5bg" x1="0" y1="0" x2="0.2" y2="1">
            <stop offset="0%" stopColor="#16283a" />
            <stop offset="55%" stopColor="#25415a" />
            <stop offset="100%" stopColor="#132234" />
          </linearGradient>
          <linearGradient id="s5glass" x1="0" y1="0" x2="1" y2="0.2">
            <stop offset="0%" stopColor={C.ice} stopOpacity="0.1" />
            <stop offset="50%" stopColor={C.ice} stopOpacity="0.03" />
            <stop offset="100%" stopColor={C.ice} stopOpacity="0.12" />
          </linearGradient>
        </defs>

        <Camera scale={scale} x={camX}>
          <rect width={1920} height={1080} fill="url(#s5bg)" />

          {/* the city, defocused into paper discs */}
          {new Array(11).fill(0).map((_, i) => {
            const r = rng(7900 + i);
            const cx = r() * 1920;
            const cy = 120 + r() * 720;
            const rad = 40 + r() * 130;
            const warm = r() > 0.45;
            const br = 0.75 + 0.25 * Math.sin(g * 0.02 + i);
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={rad}
                fill={warm ? C.gold : C.cyan}
                opacity={0.16 * br}
                style={{ mixBlendMode: 'screen' }}
              />
            );
          })}

          {/* street lamp, warm, right of centre */}
          <g opacity={blink}>
            <Glow x={1430} y={470} r={520} fill="url(#glWarm)" opacity={0.4} />
            <circle cx={1430} cy={470} r={58} fill={mix(C.gold2, C.paper, 0.5)} opacity={0.55} />
          </g>

          {/* buildings, barely there */}
          {[0, 1, 2, 3].map((i) => (
            <Paper
              key={i}
              d={tornRect({ x: 160 + i * 430, y: 700 + (i % 2) * 40, w: 380, h: 400, top: 4, bottom: 0, left: 4, right: 4, step: 30, seed: 8100 + i })}
              fill={mix(C.ink2, C.ink1, 0.4 + i * 0.1)}
              opacity={0.7}
              shadow="none"
              tex={0.4}
            />
          ))}

          {/* the figure walking past outside */}
          <g opacity={passOp * 0.55}>
            <Figure h={420} x={pass} y={930} fill={mix(C.ink1, C.black, 0.5)} pose="walk" />
          </g>

          {/* the two reflections the lamp shows for a second */}
          <g opacity={0.18 * refl}>
            <Figure h={300} x={1420} y={1000} fill={C.ice} pose="stand" />
            <Figure h={290} x={1500} y={1000} fill={C.ice} pose="stand" flip />
          </g>

          {/* the rain: paper strips on the glass */}
          {STRIPS.map((s, i) => {
            const speed = s.speed * lerp(slow, 2.2, rush);
            const y = ((s.delay + g * speed * 1.9) % 1360) - 240;
            const stretch = i === 7 ? 1 + 2.6 * stopStrip : 1;
            const yFix = i === 7 ? Math.min(y, 300 + stopStrip * 40) : y;
            return (
              <g key={i} opacity={s.op * (1 - rush * 0.2)}>
                <rect x={s.x} y={yFix} width={s.w} height={s.len * stretch} fill={C.ice} opacity={0.8} />
                <rect x={s.x} y={yFix + s.len * stretch} width={s.w} height={Math.min(90, s.len) * stretch} fill={C.ice} opacity={0.12} />
              </g>
            );
          })}

          {/* the glass itself: a scratched transparent sheet */}
          <rect width={1920} height={1080} fill="url(#s5glass)" />
          <rect width={1920} height={1080} fill="url(#scratch)" opacity={0.1} style={{ mixBlendMode: 'screen' }} />

          {/* condensation vignette at the edges of the pane */}
          <Paper
            d={P([[-10, -10], [1930, -10], [1930, 1100], [-10, 1100]]) + ' ' + P([[70, 70], [1850, 70], [1850, 1010], [70, 1010]])}
            fillRule="evenodd"
            fill={mix(C.ink1, C.ice, 0.16)}
            opacity={0.35}
            shadow="none"
            tex={0.6}
          />

          <Vignette opacity={0.95} />
          <GrainOverlay opacity={0.2} dust={0.26} />
        </Camera>

        <Wash color={mix(C.ink1, C.black, 0.4)} opacity={0.12 + 0.3 * rush} blend="multiply" />
        <Wash color={C.black} opacity={dark} blend="normal" />
      </Svg>
    </AbsoluteFill>
  );
};
