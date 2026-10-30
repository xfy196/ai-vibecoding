import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { clamp, easeInOut, ramp, springIn } from './anim';
import { Paper } from './paper/Paper';
import { tornRect } from './paper/edges';
import { C, FPS, H, LYRICS, W, mix } from './theme';

/**
 * 歌词字幕：剪纸字形贴在一条撕边纸影上。
 *
 * 时间轴直接取 .lrc 的逐行时间戳（theme.ts 的 LYRICS），一行到下一行之间显示，
 * 进字是"纸片落下"（轻微下坠 + 弹回），出字是"纸片抽走"。
 * 底衬是一条 45% 的墨色撕边纸，保证在任何背景上都读得清，同时不破坏剪纸质感。
 */

const SERIF = '"STKaiti","KaiTi","Songti SC","SimSun",serif';

const f = (s: number) => Math.round(s * FPS);

interface Line {
  at: number;
  end: number;
  text: string;
}

const LINES: Line[] = LYRICS.map((l, i) => ({
  at: l.at,
  end: i + 1 < LYRICS.length ? Math.min(l.at + 6.5, LYRICS[i + 1].at - 0.08) : l.at + 4.6,
  text: l.text,
}));

const sizeFor = (text: string) => (text.length <= 9 ? 56 : text.length <= 12 ? 50 : text.length <= 15 ? 44 : 40);

export const Lyrics: React.FC = () => {
  const frame = useCurrentFrame();

  const idx = LINES.findIndex((l) => frame >= f(l.at) - 2 && frame <= f(l.end));
  if (idx < 0) return null;
  const l = LINES[idx];

  const start = f(l.at);
  const end = f(l.end);

  const enter = springIn(frame, start, { damping: 17, stiffness: 190 });
  const out = ramp(frame, end - 9, end, 0, 1);
  const y = 968 + (1 - enter) * 26 - out * 16;
  const opacity = clamp(enter * 1.6) * (1 - out);
  const size = sizeFor(l.text);
  const width = Math.min(1560, l.text.length * size * 1.02 + 120);

  // a soft scrim so the line reads over any background, only while a line is up
  const scrim = easeInOut(clamp(Math.min(enter * 1.4, 1 - out)));
  const scrimOpacity = 0.52 * scrim;

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="lyrScrim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#000" stopOpacity="0" />
            <stop offset="45%" stopColor="#000" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="lyrStrip" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={mix(C.ink1, C.black, 0.4)} stopOpacity="0.42" />
            <stop offset="100%" stopColor={mix(C.ink1, C.black, 0.15)} stopOpacity="0.62" />
          </linearGradient>
        </defs>

        {/* bottom scrim */}
        <rect x={0} y={820} width={W} height={260} fill="url(#lyrScrim)" opacity={scrimOpacity} />

        <g opacity={opacity} transform={`translate(0 ${y - 968})`}>
          {/* the strip the characters are pasted on */}
          <g transform={`rotate(${-0.4 + 0.2 * Math.sin(frame * 0.02)})`}>
            <Paper
              d={tornRect({ x: 960 - width / 2, y: 914, w: width, h: 104, top: 6, bottom: 7, left: 4, right: 4, step: 26, seed: 3301 })}
              fill="url(#lyrStrip)"
              shadow="none"
              tex={0.5}
              edge={mix(C.paper3, C.ink1, 0.5)}
              edgeWidth={1.6}
            />
          </g>

          {/* hard paper shadow, then the cut characters on top */}
          <text
            x={960 + 3}
            y={968 + 5}
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily={SERIF}
            fontSize={size}
            fontWeight={600}
            letterSpacing={5}
            fill="#04050a"
            opacity={0.55}
          >
            {l.text}
          </text>
          <text
            x={960}
            y={968}
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily={SERIF}
            fontSize={size}
            fontWeight={600}
            letterSpacing={5}
            fill={mix(C.paper, C.paper2, 0.35)}
          >
            {l.text}
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};
