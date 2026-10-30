import React from 'react';
import { staticFile } from 'remotion';
import { C, H, W, light } from '../theme';

/**
 * Shared paper-cut scaffolding: the grain patterns every sheet is printed on,
 * the `<Paper>` primitive every layer is built from, and the virtual camera.
 */

export const PaperDefs: React.FC = () => (
  <defs>
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
    <pattern id="scratch" width={512} height={512} patternUnits="userSpaceOnUse">
      <image href={staticFile('tex/scratch.png')} width={512} height={512} />
    </pattern>

    {/* light */}
    <radialGradient id="glWarm">
      <stop offset="0%" stopColor={C.gold2} stopOpacity="0.95" />
      <stop offset="38%" stopColor={C.gold} stopOpacity="0.45" />
      <stop offset="100%" stopColor={C.gold3} stopOpacity="0" />
    </radialGradient>
    <radialGradient id="glCold">
      <stop offset="0%" stopColor={C.ice} stopOpacity="0.7" />
      <stop offset="100%" stopColor={C.ice} stopOpacity="0" />
    </radialGradient>
    <radialGradient id="glRed">
      <stop offset="0%" stopColor={C.red2} stopOpacity="0.8" />
      <stop offset="100%" stopColor={C.red3} stopOpacity="0" />
    </radialGradient>

    <linearGradient id="vig" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#000" stopOpacity="0.5" />
      <stop offset="30%" stopColor="#000" stopOpacity="0" />
      <stop offset="70%" stopColor="#000" stopOpacity="0" />
      <stop offset="100%" stopColor="#000" stopOpacity="0.55" />
    </linearGradient>
  </defs>
);

type ShadowName = 'none' | 'near' | 'mid' | 'soft' | 'deep';

const SHADOW: Record<ShadowName, { dy: number; dx: number; a: number } | undefined> = {
  none: undefined,
  near: { dx: 0, dy: 4, a: 0.26 },
  mid: { dx: 0, dy: 11, a: 0.3 },
  soft: { dx: 0, dy: 22, a: 0.34 },
  deep: { dx: 0, dy: 40, a: 0.42 },
};

export interface PaperProps {
  /** path data — may contain several sub-paths (then pass fillRule="evenodd") */
  d: string;
  fill: string;
  shadow?: ShadowName;
  /** edge highlight colour; `true` derives one from the fill */
  edge?: string | boolean;
  edgeWidth?: number;
  /** paper fibre strength 0..1 */
  tex?: number;
  opacity?: number;
  transform?: string;
  fillRule?: 'evenodd' | 'nonzero';
  blend?: React.CSSProperties['mixBlendMode'];
  /** a light rim behind the shape, to separate dark paper from dark paper */
  rim?: string;
  rimWidth?: number;
}

/**
 * One cut-paper shape: flat fill + fibre + edge highlight + a hard offset
 * shadow. The shadow is a duplicated silhouette rather than an SVG blur, which
 * is how a paper diorama under a hard light actually looks — and it renders an
 * order of magnitude faster than feDropShadow does.
 */
export const Paper: React.FC<PaperProps> = ({
  d,
  fill,
  shadow = 'none',
  edge,
  edgeWidth = 2.4,
  tex = 0.4,
  opacity = 1,
  transform,
  fillRule = 'nonzero',
  blend,
  rim,
  rimWidth = 3,
}) => {
  const edgeColor = edge === true ? light(fill, 0.24) : typeof edge === 'string' ? edge : undefined;
  const sh = SHADOW[shadow];
  return (
    <g transform={transform} opacity={opacity} style={blend ? { mixBlendMode: blend } : undefined}>
      {sh ? (
        <path d={d} fill="#04050a" opacity={sh.a} transform={`translate(${sh.dx} ${sh.dy})`} fillRule={fillRule} />
      ) : null}
      <path d={d} fill={fill} fillRule={fillRule} />
      {tex > 0 ? <path d={d} fill="url(#fiber)" opacity={tex * 0.32} fillRule={fillRule} /> : null}
      {rim ? (
        <path d={d} fill="none" stroke={rim} strokeWidth={rimWidth} opacity={0.5} fillRule={fillRule} />
      ) : null}
      {edgeColor ? (
        <path d={d} fill="none" stroke={edgeColor} strokeWidth={edgeWidth} opacity={0.55} fillRule={fillRule} />
      ) : null}
    </g>
  );
};

/** Full-frame paper grain, so every layer feels like the same stock. */
export const GrainOverlay: React.FC<{ opacity?: number; dust?: number }> = ({ opacity = 0.15, dust = 0.2 }) => (
  <g pointerEvents="none">
    <rect width={W} height={H} fill="url(#grain)" opacity={opacity} style={{ mixBlendMode: 'overlay' }} />
    <rect width={W} height={H} fill="url(#dust)" opacity={dust} style={{ mixBlendMode: 'screen' }} />
  </g>
);

/** Vignette + top/bottom falloff: the stop-motion tabletop feel. */
export const Vignette: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => (
  <rect width={W} height={H} fill="url(#vig)" opacity={opacity} pointerEvents="none" />
);

/** Virtual camera: scale/rotate/translate in scene coordinates. */
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
    transform={`translate(${(960 + x).toFixed(2)} ${(540 + y).toFixed(2)}) rotate(${rotate.toFixed(3)}) scale(${scale.toFixed(
      5,
    )}) translate(${-originX} ${-originY})`}
  >
    {children}
  </g>
);

/** The <svg> root every shot uses. */
export const Svg: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
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

/** Soft radial glow drawn inside any group (cheap, no filters). */
export const Glow: React.FC<{
  x: number;
  y: number;
  r: number;
  fill?: string;
  opacity?: number;
  blend?: React.CSSProperties['mixBlendMode'];
}> = ({ x, y, r, fill = 'url(#glWarm)', opacity = 0.8, blend = 'screen' }) => (
  <circle cx={x} cy={y} r={r} fill={fill} opacity={opacity} style={blend ? { mixBlendMode: blend } : undefined} />
);

/** A flat wash of one colour over the frame (colour temperature shifts). */
export const Wash: React.FC<{ color: string; opacity: number; blend?: React.CSSProperties['mixBlendMode'] }> = ({
  color,
  opacity,
  blend = 'multiply',
}) => (
  <rect width={W} height={H} fill={color} opacity={opacity} style={{ mixBlendMode: blend }} pointerEvents="none" />
);
