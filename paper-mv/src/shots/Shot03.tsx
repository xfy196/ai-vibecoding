import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { pulse, ramp, springIn } from '../anim';
import { Boy, Girl } from '../paper/figures';
import { Camera, GrainOverlay, Paper, Svg, Vignette } from '../paper/Paper';
import { blob } from '../paper/paths';
import { BEAT, C, H, W, light, mix } from '../theme';

/** ???close on the boy, a paper thought bubble grows beat by beat, cold turns warm. */
export const Shot03: React.FC<{ t0: number }> = ({ t0 }) => {
  const frame = useCurrentFrame();
  const g = frame + t0;
  const lf = frame;

  const warmth = ramp(lf, 0, 46, 0.0, 1.0);
  const bg = mix('#081228', '#2a1b34', warmth);
  const sky2 = mix('#0d1a3c', '#6b3a3f', warmth * 0.9);
  const key = mix('#16305c', '#8a4a35', warmth);

  const grow = [0, 1, 2].map((k) => springIn(g, t0 + k * BEAT, { damping: 13, stiffness: 95, mass: 0.9 }));
  const bubbleR = 42 + grow[0] * 34 + grow[1] * 34 + grow[2] * 22;

  const lanternPulse = pulse(g, BEAT, 2.0);

  return (
    <AbsoluteFill style={{ backgroundColor: bg }}>
      <Svg>
        <defs>
          <radialGradient id="s3warm" cx="0.42" cy="0.62" r="0.62">
            <stop offset="0%" stopColor={C.warm} stopOpacity="0.55" />
            <stop offset="55%" stopColor={C.amber} stopOpacity="0.16" />
            <stop offset="100%" stopColor={C.amber} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="s3bg" x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0%" stopColor={bg} />
            <stop offset="70%" stopColor={sky2} />
            <stop offset="100%" stopColor={key} />
          </linearGradient>
        </defs>

        <Camera scale={(1.02 + warmth * 0.04) * (1 + 0.0065 * pulse(g, BEAT, 3))} x={0} y={warmth * -8}>
          <rect width={W} height={H} fill="url(#s3bg)" />
          <rect width={W} height={H} fill="url(#s3warm)" opacity={0.25 + warmth * 0.75} />

          {/* soft paper backdrop blobs shifting from cold to warm */}
          <Paper
            d={blob(360, 780, 520, 300, 71, 4, 24, 0.18)}
            fill={mix('#0f2347', '#7a4433', warmth)}
            shadow="soft"
            tex={0.4}
            opacity={0.9}
          />
          <Paper
            d={blob(1500, 900, 560, 330, 72, 4, 24, 0.16)}
            fill={mix('#132a55', '#8a4e35', warmth)}
            shadow="soft"
            tex={0.4}
            opacity={0.85}
          />

          {/* the boy, very close */}
          <g transform="translate(560 1400) scale(5.2)">
            {/* a second, lighter sheet peeking out behind = paper rim light */}
            <g transform="translate(7 -6)" opacity={0.55 + warmth * 0.3}>
              <Boy x={0} y={0} scale={1.012} fill={mix('#2b4a7a', '#c98a54', warmth)} lanternGlow={0} />
            </g>
            <Boy x={0} y={0} scale={1} fill={mix(C.ink, '#2a1526', warmth * 0.9)} lanternGlow={0.45 + 0.4 * lanternPulse} />
          </g>

          {/* thought bubble: trail, then her silhouette inside */}
          <g transform={`translate(1215 320)`}>
            <circle cx={-176} cy={186} r={26 + grow[0] * 8} fill={mix(C.paper, C.gold2, warmth)} opacity={0.9} />
            <circle cx={-236} cy={244} r={14 + grow[0] * 6} fill={mix(C.paper, C.gold2, warmth)} opacity={0.85} />

            <g>
              <circle r={bubbleR} fill={mix('#1b2d55', '#f6e2c4', 0.35 + warmth * 0.5)} />
              <circle r={bubbleR} fill="url(#fiber)" opacity={0.32} />
              <circle r={bubbleR} fill="none" stroke={mix(C.foam, C.gold2, warmth)} strokeWidth={3} opacity={0.6} />
            </g>
            <circle r={bubbleR * 0.86} fill="none" stroke={mix(C.foam, C.amber2, warmth)} strokeWidth={2} opacity={0.45} strokeDasharray="10 16" />

            <g transform={`translate(0 ${bubbleR * 0.94}) scale(${0.42 + grow[2] * 0.1})`} opacity={ramp(g, t0 + 2 * BEAT, t0 + 2 * BEAT + 10)}>
              <Girl x={0} y={0} scale={1} fill={mix('#2b1a3f', '#5c2d3f', warmth)} wave={-14 * pulse(g, BEAT, 2)} />
            </g>
          </g>

          {/* warm light licking the frame edge */}
          <rect
            width={W}
            height={H}
            fill={mix(C.amber, C.warm, 0.4)}
            opacity={warmth * 0.22}
          />

          <Vignette opacity={0.95} />
          <GrainOverlay opacity={0.15} dust={0.22} />
        </Camera>
      </Svg>
    </AbsoluteFill>
  );
};
