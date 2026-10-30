import React from 'react';
import { Paper } from './Paper';
import { blob, coil, crescent, P, rrect, shard, tornRect } from './edges';

/**
 * Reusable cut-paper props. Every figure is a silhouette with its own hard
 * shadow — no outlines, no gradients: paper only reads as paper when the
 * shapes are flat.
 *
 * Coordinates: every figure is drawn in its own local space with the origin at
 * its "base" (feet / bottom centre), then placed with a transform.
 */

// ------------------------------------------------------------------- people
export const Figure: React.FC<{
  h?: number;
  fill: string;
  pose?: 'stand' | 'sit' | 'walk' | 'reach' | 'hold';
  flip?: boolean;
  shadow?: 'none' | 'near' | 'mid' | 'soft';
  x?: number;
  y?: number;
  opacity?: number;
  rim?: string;
}> = ({ h = 300, fill, pose = 'stand', flip = false, shadow = 'near', x = 0, y = 0, opacity = 1, rim }) => {
  const k = h / 322;
  const d = pose === 'sit' ? SIT : pose === 'walk' ? WALK : pose === 'reach' ? REACH : pose === 'hold' ? HOLD : STAND;
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -k : k} ${k})`} opacity={opacity}>
      <Paper d={d} fill={fill} shadow={shadow} tex={0.35} rim={rim} edge={false} />
    </g>
  );
};

const STAND =
  'M-22 -300 A22 22 0 1 1 22 -300 A22 22 0 0 1 13 -281 L16 -268 L46 -250 L54 -168 L36 -150 L30 -8 L9 -8 L3 -158 L-3 -158 L-9 -8 L-30 -8 L-36 -150 L-54 -168 L-46 -250 L-16 -268 L-13 -281 Z';

const WALK =
  'M-22 -300 A22 22 0 1 1 22 -300 A22 22 0 0 1 13 -281 L16 -268 L44 -248 L50 -164 L32 -148 L40 -86 L52 -6 L30 -4 L12 -78 L-6 -160 L-12 -158 L-22 -84 L-34 -8 L-56 -10 L-38 -86 L-44 -150 L-54 -166 L-46 -248 L-16 -268 L-13 -281 Z';

const REACH =
  'M-22 -300 A22 22 0 1 1 22 -300 A22 22 0 0 1 13 -281 L16 -268 L52 -262 L74 -320 L92 -312 L74 -252 L40 -244 L48 -168 L36 -150 L30 -8 L9 -8 L3 -158 L-3 -158 L-9 -8 L-30 -8 L-36 -150 L-54 -170 L-46 -250 L-16 -268 L-13 -281 Z';

const HOLD =
  'M-22 -300 A22 22 0 1 1 22 -300 A22 22 0 0 1 13 -281 L16 -268 L46 -250 L52 -196 L40 -168 L26 -196 L24 -158 L34 -150 L30 -8 L9 -8 L3 -158 L-3 -158 L-9 -8 L-30 -8 L-36 -150 L-52 -170 L-46 -250 L-16 -268 L-13 -281 Z';

const SIT =
  'M-22 -300 A22 22 0 1 1 22 -300 A22 22 0 0 1 13 -281 L16 -268 L44 -252 L50 -200 L34 -186 L16 -196 L18 -158 L54 -150 L58 -128 L10 -124 L-16 -128 L-20 -96 L-14 -10 L-40 -8 L-46 -60 L-40 -140 L-50 -170 L-44 -250 L-16 -268 L-13 -281 Z';

// ------------------------------------------------------------------ objects
/** Wine glass, base at (0,0), height ~300 in local units. */
export const Glass: React.FC<{
  h?: number;
  fill: string;
  liquid?: string;
  liquidTop?: number;
  opacity?: number;
  x?: number;
  y?: number;
  rotate?: number;
  rim?: string;
}> = ({ h = 300, fill, liquid, liquidTop = 0.55, opacity = 1, x = 0, y = 0, rotate = 0, rim }) => {
  const k = h / 300;
  const bowl = 'M-84 -300 L-30 -140 L30 -140 L84 -300 Z';
  const stem = 'M-7 -140 L-7 -22 L-52 -12 L-52 0 L52 0 L52 -12 L7 -22 L7 -140 Z';
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${k})`} opacity={opacity}>
      <Paper d={`${bowl} ${stem}`} fill={fill} shadow="soft" tex={0.3} edge={true} rim={rim} fillRule="nonzero" />
      {liquid ? (
        <path
          d={`M${-84 + 168 * 0.16} ${-300 + 160 * (1 - liquidTop) * 0.9} L-30 -140 L30 -140 L${84 - 168 * 0.16} ${-300 + 160 * (1 - liquidTop) * 0.9} Z`}
          fill={liquid}
          opacity={0.85}
        />
      ) : null}
    </g>
  );
};

/** Rice bowl in side view, base at (0,0). */
export const Bowl: React.FC<{ w?: number; fill: string; x?: number; y?: number; amount?: number; shadow?: 'none' | 'near' | 'mid' | 'soft' }> = ({
  w = 220,
  fill,
  x = 0,
  y = 0,
  amount = 0.5,
  shadow = 'near',
}) => {
  const k = w / 220;
  const bowl = 'M-110 -96 Q-100 6 0 6 Q100 6 110 -96 Z';
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      <Paper d={bowl} fill={fill} shadow={shadow} tex={0.45} edge={true} />
      {amount > 0 ? (
        <path d={`M-92 ${-96 + 14 * (1 - amount)} Q0 ${-88 + 20 * (1 - amount)} 92 ${-96 + 14 * (1 - amount)} L92 -96 L-92 -96 Z`} fill="#efe3c8" opacity={0.9} />
      ) : null}
      <ellipse cx={0} cy={-96} rx={110} ry={17} fill="none" stroke="#ffffff" strokeOpacity={0.22} strokeWidth={3} />
    </g>
  );
};

/** One chopstick, lying at an angle. */
export const Chopstick: React.FC<{ len?: number; fill: string; x?: number; y?: number; rot?: number }> = ({
  len = 300,
  fill,
  x = 0,
  y = 0,
  rot = 0,
}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <Paper d={rrect(0, -5, len, 10, 5)} fill={fill} shadow="near" tex={0.2} />
  </g>
);

/** Smartphone lying flat, screen up (for the top-down shot). */
export const Phone: React.FC<{ w?: number; x?: number; y?: number; rot?: number; body?: string; screen?: string; glow?: number }> = ({
  w = 200,
  x = 0,
  y = 0,
  rot = 0,
  body = '#20262c',
  screen = '#cfe0ee',
  glow = 0.5,
}) => {
  const h = w * 2;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <Paper d={rrect(-w / 2, -h / 2, w, h, w * 0.12)} fill={body} shadow="mid" tex={0.2} edge={true} />
      <rect x={-w / 2 + w * 0.06} y={-h / 2 + w * 0.09} width={w * 0.88} height={h - w * 0.18} rx={w * 0.06} fill={screen} opacity={glow} />
      <rect x={-w * 0.12} y={-h / 2 + w * 0.04} width={w * 0.24} height={w * 0.04} rx={w * 0.02} fill="#0b0f14" opacity={0.6} />
    </g>
  );
};

/** Sky lantern (孔明灯): trapezoid body + hot mouth. Base at (0,0). */
export const Lantern: React.FC<{
  h?: number;
  body: string;
  glow?: string;
  x?: number;
  y?: number;
  rot?: number;
  lit?: number;
  opacity?: number;
}> = ({ h = 120, body, glow = '#ffc45c', x = 0, y = 0, rot = 0, lit = 1, opacity = 1 }) => {
  const k = h / 120;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${k})`} opacity={opacity}>
      <Paper d="M-46 0 L46 0 L58 -104 Q0 -120 -58 -104 Z" fill={body} shadow="none" tex={0.3} edge={lighten(body)} />
      <path d="M-4 0 L4 0 L4 10 L-4 10 Z" fill="#3a2a18" opacity={0.5} />
      <ellipse cx={0} cy={-2} rx={18} ry={12} fill={glow} opacity={0.35 + 0.6 * lit} />
      <ellipse cx={0} cy={-30} rx={34} ry={44} fill={glow} opacity={0.14 + 0.5 * lit} style={{ mixBlendMode: 'screen' }} />
    </g>
  );
};

const lighten = (hex: string) => {
  const s = hex.replace('#', '');
  const v = s.length === 3 ? s.split('').map((c) => c + c).join('') : s;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16));
  const m = (n: number) => Math.min(255, Math.round(n + (255 - n) * 0.24)).toString(16).padStart(2, '0');
  return `#${m(r)}${m(g)}${m(b)}`;
};

/** Chinese coin (铜钱): disc with a square hole. */
export const Coin: React.FC<{ r?: number; fill: string; x?: number; y?: number; rot?: number; opacity?: number }> = ({
  r = 26,
  fill,
  x = 0,
  y = 0,
  rot = 0,
  opacity = 1,
}) => {
  const h = r * 0.36;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`} opacity={opacity}>
      <Paper
        d={`M${-r} 0 A${r} ${r} 0 1 1 ${r} 0 A${r} ${r} 0 1 1 ${-r} 0 Z M${-h} ${-h} L${h} ${-h} L${h} ${h} L${-h} ${h} Z`}
        fill={fill}
        fillRule="evenodd"
        shadow="near"
        tex={0.3}
      />
    </g>
  );
};

/** Four-point sparkle. */
export const Sparkle: React.FC<{ r?: number; fill: string; x?: number; y?: number; opacity?: number; rot?: number }> = ({
  r = 10,
  fill,
  x = 0,
  y = 0,
  opacity = 1,
  rot = 0,
}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`} opacity={opacity}>
    <path d={P([[0, -r], [r * 0.22, -r * 0.22], [r, 0], [r * 0.22, r * 0.22], [0, r], [-r * 0.22, r * 0.22], [-r, 0], [-r * 0.22, -r * 0.22]])} fill={fill} />
  </g>
);

/** Paper steam: a few coils rising out of a bowl or cup. */
export const Steam: React.FC<{
  x: number;
  y: number;
  t: number;
  scale?: number;
  color?: string;
  count?: number;
  opacity?: number;
}> = ({ x, y, t, scale = 1, color = '#f2e7d2', count = 3, opacity = 0.5 }) => (
  <g opacity={opacity}>
    {new Array(count).fill(0).map((_, i) => {
      const ph = (t * 0.45 + i * 0.33) % 1;
      const yy = y - ph * 150 * scale;
      const op = Math.sin(Math.PI * ph) * 0.85;
      const sway = Math.sin(ph * 6 + i * 2) * 12;
      return (
        <g key={i} transform={`translate(${x + (i - (count - 1) / 2) * 26 * scale + sway} ${yy}) scale(${scale})`} opacity={op}>
          <path d={coil(0, 0, 22, 1.1, i % 2 ? 1 : -1)} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" opacity={0.75} />
        </g>
      );
    })}
  </g>
);

/** Steel chopstick rest / a small paper scrap scattered for texture. */
export const Scrap: React.FC<{ x: number; y: number; size?: number; fill: string; seed?: number; rot?: number; opacity?: number }> = ({
  x,
  y,
  size = 18,
  fill,
  seed = 1,
  rot = 0,
  opacity = 0.8,
}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`} opacity={opacity}>
    <Paper d={shard(size, size * 0.7, seed, 6)} fill={fill} shadow="near" tex={0.4} />
  </g>
);

/** Wall-clock face with hands, for the "day and night" beats. */
export const ClockFace: React.FC<{ r?: number; x?: number; y?: number; face: string; ink: string; hand: number; opacity?: number }> = ({
  r = 70,
  x = 0,
  y = 0,
  face,
  ink,
  hand,
  opacity = 1,
}) => {
  const a = hand * Math.PI * 2;
  const b = hand * Math.PI * 2 * 12;
  return (
    <g transform={`translate(${x} ${y})`} opacity={opacity}>
      <Paper d={`M${-r} 0 A${r} ${r} 0 1 1 ${r} 0 A${r} ${r} 0 1 1 ${-r} 0 Z`} fill={face} shadow="mid" tex={0.3} edge={true} />
      {new Array(12).fill(0).map((_, i) => {
        const t = (i / 12) * Math.PI * 2;
        return (
          <line
            key={i}
            x1={Math.sin(t) * r * 0.78}
            y1={-Math.cos(t) * r * 0.78}
            x2={Math.sin(t) * r * 0.9}
            y2={-Math.cos(t) * r * 0.9}
            stroke={ink}
            strokeWidth={r * 0.05}
            opacity={0.55}
          />
        );
      })}
      <line x1={0} y1={0} x2={Math.sin(a) * r * 0.62} y2={-Math.cos(a) * r * 0.62} stroke={ink} strokeWidth={r * 0.09} strokeLinecap="round" />
      <line x1={0} y1={0} x2={Math.sin(b) * r * 0.42} y2={-Math.cos(b) * r * 0.42} stroke={ink} strokeWidth={r * 0.06} strokeLinecap="round" opacity={0.8} />
    </g>
  );
};

/** A 剪纸 囍 / single character, cut out and hung. */
export const PaperChar: React.FC<{
  text: string;
  size?: number;
  x?: number;
  y?: number;
  fill: string;
  rot?: number;
  opacity?: number;
  family?: string;
  weight?: number;
  letterSpacing?: number;
}> = ({ text, size = 120, x = 0, y = 0, fill, rot = 0, opacity = 1, family = '"STKaiti","KaiTi","SimSun",serif', weight = 700, letterSpacing = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`} opacity={opacity}>
    <text
      x={0}
      y={0}
      textAnchor="middle"
      dominantBaseline="central"
      fontFamily={family}
      fontSize={size}
      fontWeight={weight}
      letterSpacing={letterSpacing}
      fill={fill}
    >
      {text}
    </text>
  </g>
);

/** Round banquet table seen from the side: ellipse top + cloth skirt. */
export const Table: React.FC<{ w?: number; h?: number; x?: number; y?: number; cloth: string; top: string; shadow?: 'none' | 'near' | 'mid' | 'soft' | 'deep' }> = ({
  w = 420,
  h = 150,
  x = 0,
  y = 0,
  cloth,
  top,
  shadow = 'mid',
}) => (
  <g transform={`translate(${x} ${y})`}>
    <Paper d={rrect(-w / 2, 0, w, h, 10)} fill={cloth} shadow={shadow} tex={0.35} edge={true} />
    <Paper d={`M${-w / 2} 0 A${w / 2} ${w * 0.16} 0 0 1 ${w / 2} 0 Z`} fill={top} shadow="none" tex={0.25} edge={true} />
  </g>
);

/** Chair, side view (base at 0,0). */
export const Chair: React.FC<{ h?: number; x?: number; y?: number; fill: string; rot?: number; shadow?: 'none' | 'near' | 'mid' }> = ({
  h = 160,
  x = 0,
  y = 0,
  fill,
  rot = 0,
  shadow = 'near',
}) => {
  const k = h / 160;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${k})`}>
      <Paper
        d="M-34 -76 L34 -76 L34 -64 L-34 -64 Z M-30 -160 L-22 -160 L-22 -76 L-30 -76 Z M22 -132 L30 -132 L30 -76 L22 -76 Z M-30 -76 L-26 0 L-18 0 L-20 -76 Z M20 -76 L26 0 L34 0 L30 -76 Z"
        fill={fill}
        shadow={shadow}
        tex={0.3}
      />
    </g>
  );
};

/** Cardboard carton / stacked boxes for the "can't afford it" beats. */
export const Box: React.FC<{ w?: number; h?: number; x?: number; y?: number; fill: string; rot?: number }> = ({
  w = 120,
  h = 90,
  x = 0,
  y = 0,
  fill,
  rot = 0,
}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <Paper d={tornRect({ x: -w / 2, y: -h, w, h, top: 3, bottom: 3, left: 3, right: 3, step: 16, seed: 41 })} fill={fill} shadow="mid" tex={0.4} edge={true} />
    <line x1={-w / 2} y1={-h * 0.62} x2={w / 2} y2={-h * 0.62} stroke="#000" strokeOpacity={0.18} strokeWidth={3} />
  </g>
);

export { crescent, blob };
