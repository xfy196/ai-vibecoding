import React from 'react';
import { staticFile } from 'remotion';
import { C, H, W, light } from '../theme';

/**
 * Shared paper-cut scaffolding: grain patterns, paper drop shadows, and the
 * `<Paper>` primitive that every layer in the film is built from.
 */

export const PaperDefs: React.FC = () => (
  <defs>
    {/* fibre + grain textures */}
    <pattern id="grain" width={256} height={256} patternUnits="userSpaceOnUse">
      <image href={staticFile('tex/grain.png')} width={256} height={256} />
    </pattern>
    <pattern id="fiber" width={512} height={512} patternUnits="userSpaceOnUse">
      <image href={staticFile('tex/fiber.png')} width={512} height={512} />
    </pattern>
    <pattern id="blotch" width={512} height={512} patternUnits="userSpaceOnUse">
      <image href={staticFile('tex/blotch.png')} width={512} height={512} />
    </pattern>
    <pattern id="dust" width={256} height={256} patternUnits="userSpaceOnUse">
      <image href={staticFile('tex/dust.png')} width={256} height={256} />
    </pattern>

    {/* light */}
    <radialGradient id="glLantern">
      <stop offset="0%" stopColor={C.amber2} stopOpacity="0.95" />
      <stop offset="35%" stopColor={C.amber} stopOpacity="0.5" />
      <stop offset="100%" stopColor={C.amber3} stopOpacity="0" />
    </radialGradient>
    <radialGradient id="glMoon">
      <stop offset="0%" stopColor={C.moon} stopOpacity="0.55" />
      <stop offset="55%" stopColor={C.moon} stopOpacity="0.14" />
      <stop offset="100%" stopColor={C.moon} stopOpacity="0" />
    </radialGradient>
    <radialGradient id="glGold">
      <stop offset="0%" stopColor={C.gold2} stopOpacity="0.9" />
      <stop offset="45%" stopColor={C.gold} stopOpacity="0.42" />
      <stop offset="100%" stopColor={C.gold3} stopOpacity="0" />
    </radialGradient>
    <radialGradient id="glCool">
      <stop offset="0%" stopColor={C.foam} stopOpacity="0.5" />
      <stop offset="100%" stopColor={C.foam} stopOpacity="0" />
    </radialGradient>

    <linearGradient id="vig" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#000" stopOpacity="0.42" />
      <stop offset="34%" stopColor="#000" stopOpacity="0" />
      <stop offset="72%" stopColor="#000" stopOpacity="0" />
      <stop offset="100%" stopColor="#000" stopOpacity="0.5" />
    </linearGradient>
  </defs>
);

type ShadowName = 'soft' | 'mid' | 'near' | 'none';

export interface PaperProps {
  d: string;
  fill: string;
  shadow?: ShadowName;
  /** paper edge highlight; pass a colour, or true for an automatic one */
  edge?: string | boolean;
  edgeWidth?: number;
  /** fibre texture strength 0..1 */
  tex?: number;
  opacity?: number;
  blend?: React.CSSProperties['mixBlendMode'];
  transform?: string;
  filter?: string;
}

const shadowSpec: Record<ShadowName, { dx: number; dy: number; a: number } | undefined> = {
  soft: { dx: 0, dy: 22, a: 0.34 },
  mid: { dx: 0, dy: 11, a: 0.28 },
  near: { dx: 0, dy: 5, a: 0.22 },
  none: undefined,
};

/**
 * One cut-paper shape: flat fill + fibre + edge highlight + a hard offset
 * shadow. The shadow is a duplicated silhouette rather than an SVG blur,
 * which is what a real paper diorama under a hard light looks like ?and it
 * renders orders of magnitude faster than feDropShadow.
 */
export const Paper: React.FC<PaperProps> = ({
  d,
  fill,
  shadow = 'none',
  edge,
  edgeWidth = 2.4,
  tex = 0.4,
  opacity = 1,
  blend,
  transform,
}) => {
  const edgeColor = edge === true ? light(fill, 0.22) : typeof edge === 'string' ? edge : undefined;
  const sh = shadowSpec[shadow];
  return (
    <g transform={transform} opacity={opacity} style={blend ? { mixBlendMode: blend } : undefined}>
      {sh ? (
        <path d={d} fill="#03060d" opacity={sh.a} transform={`translate(${sh.dx} ${sh.dy})`} />
      ) : null}
      <path d={d} fill={fill} />
      {tex > 0 ? <path d={d} fill="url(#fiber)" opacity={tex * 0.3} /> : null}
      {edgeColor ? <path d={d} fill="none" stroke={edgeColor} strokeWidth={edgeWidth} opacity={0.55} /> : null}
    </g>
  );
};

/** Full-frame paper grain so every layer feels like the same sheet stock. */
export const GrainOverlay: React.FC<{ opacity?: number; dust?: number }> = ({
  opacity = 0.16,
  dust = 0.22,
}) => (
  <g pointerEvents="none">
    <rect width={W} height={H} fill="url(#grain)" opacity={opacity} style={{ mixBlendMode: 'overlay' }} />
    <rect width={W} height={H} fill="url(#dust)" opacity={dust} style={{ mixBlendMode: 'screen' }} />
  </g>
);

/** Vignette + top/bottom darkening, sells the stop-motion tabletop feel. */
export const Vignette: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => (
  <rect width={W} height={H} fill="url(#vig)" opacity={opacity} pointerEvents="none" />
);

/** Virtual camera: scale/rotate around a point, in scene coordinates. */
export const Camera: React.FC<{
  scale?: number;
  x?: number;
  y?: number;
  rotate?: number;
  originX?: number;
  originY?: number;
  children: React.ReactNode;
}> = ({ scale = 1, x = 0, y = 0, rotate = 0, originX = 960, originY = 540, children }) => (
  <g
    transform={`translate(${960 + x} ${540 + y}) rotate(${rotate}) scale(${scale}) translate(${
      -originX
    } ${-originY})`}
  >
    {children}
  </g>
);

export const Svg: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style,
}) => (
  <svg
    width={W}
    height={H}
    viewBox={`0 0 ${W} ${H}`}
    style={{ position: 'absolute', inset: 0, ...style }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <PaperDefs />
    {children}
  </svg>
);
