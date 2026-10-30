import React from 'react';
import { C, light } from '../theme';
import { blob, BOAT_HULL, BOAT_SAIL_L, BOAT_SAIL_R, lanternPath, sparkle, whalePath } from './paths';
import { Paper } from './Paper';

/**
 * Paper-cut actors. Every figure is drawn in local coordinates with the origin
 * at its base, so scenes can place them with transform only.
 */

export const Moon: React.FC<{
  x: number;
  y: number;
  r: number;
  fill?: string;
  halo?: number;
  opacity?: number;
  craters?: boolean;
}> = ({ x, y, r, fill = C.moon, halo = 1, opacity = 1, craters = true }) => (
  <g transform={`translate(${x} ${y})`} opacity={opacity}>
    {halo > 0 ? <circle r={r * 3.1} fill="url(#glMoon)" opacity={halo} /> : null}
    <g>
      <circle r={r} fill={fill} />
      <circle r={r} fill="url(#fiber)" opacity={0.3} />
      <circle r={r} fill="none" stroke={light(fill, 0.3)} strokeWidth={3} opacity={0.6} />
    </g>
    {craters ? (
      <g fill={C.moon2} opacity={0.42}>
        <circle cx={-r * 0.34} cy={-r * 0.22} r={r * 0.16} />
        <circle cx={r * 0.22} cy={r * 0.34} r={r * 0.11} />
        <circle cx={r * 0.36} cy={-r * 0.4} r={r * 0.07} />
        <circle cx={-r * 0.1} cy={r * 0.52} r={r * 0.06} />
      </g>
    ) : null}
  </g>
);

export const PaperBoat: React.FC<{
  x?: number;
  y?: number;
  scale?: number;
  rotate?: number;
  hull?: string;
  sail?: string;
  sail2?: string;
  opacity?: number;
}> = ({ x = 0, y = 0, scale = 1, rotate = 0, hull = C.paper, sail = C.cream, sail2 = C.moon2, opacity = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`} opacity={opacity}>
    <g>
      <path d={BOAT_HULL} fill={hull} />
      <path d={BOAT_HULL} fill="url(#fiber)" opacity={0.3} />
      <path d={BOAT_HULL} fill="none" stroke={light(hull, 0.35)} strokeWidth={2.4} opacity={0.5} />
    </g>
    <g>
      <path d={BOAT_SAIL_L} fill={sail} />
      <path d={BOAT_SAIL_R} fill={sail2} />
      <path d={BOAT_SAIL_L} fill="none" stroke={light(sail, 0.3)} strokeWidth={2} opacity={0.55} />
      <path d={BOAT_SAIL_R} fill="none" stroke={light(sail2, 0.3)} strokeWidth={2} opacity={0.55} />
    </g>
    <path d="M -84 6 L 84 6" stroke={light(hull, -0.25)} strokeWidth={4} opacity={0.3} />
  </g>
);

/** The boy with the lantern. Height ~ 215 in local units. */
export const Boy: React.FC<{
  x?: number;
  y?: number;
  scale?: number;
  rotate?: number;
  fill?: string;
  lanternGlow?: number;
  lanternFill?: string;
  opacity?: number;
  facing?: 1 | -1;
}> = ({
  x = 0,
  y = 0,
  scale = 1,
  rotate = 0,
  fill = C.inkDeep,
  lanternGlow = 1,
  lanternFill = C.amber2,
  opacity = 1,
  facing = 1,
}) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${facing * scale} ${scale})`} opacity={opacity}>
    {lanternGlow > 0 ? <circle cx={62} cy={-128} r={130} fill="url(#glLantern)" opacity={lanternGlow} /> : null}
    <g fill={fill}>
      {/* head + hair tuft */}
      <circle cx={2} cy={-186} r={23} />
      <path d="M -14 -204 C -4 -218 18 -212 20 -196 C 12 -206 -4 -204 -14 -204 Z" />
      {/* torso */}
      <path d="M -21 -164 C -34 -150 -38 -104 -33 -76 L 33 -76 C 38 -104 34 -150 21 -164 Z" />
      {/* legs */}
      <path d="M -30 -78 L -12 -78 L -9 -2 L -25 -2 Z" />
      <path d="M 12 -78 L 30 -78 L 27 -2 L 11 -2 Z" />
      {/* arm holding the lantern up */}
      <path d="M 14 -156 C 30 -150 48 -140 56 -128 L 48 -120 C 38 -132 24 -140 8 -144 Z" />
      {/* scarf */}
      <path d="M -20 -166 C -6 -158 10 -158 22 -166 C 16 -150 -14 -150 -20 -166 Z" fill={light(fill, 0.08)} />
    </g>
    {/* lantern: paper shade + glow + hook */}
    <g transform="translate(62 -128)">
      <path d="M 0 -22 L 0 -14" stroke={fill} strokeWidth={3} />
      <path d={lanternPath(40, 48, 7)} fill={lanternFill} />
      <path d={lanternPath(40, 48, 7)} fill="none" stroke={light(lanternFill, 0.4)} strokeWidth={2} opacity={0.7} />
      <ellipse cx={0} cy={0} rx={12} ry={16} fill={C.paper} opacity={0.5} />
    </g>
  </g>
);

/** The girl: paper-cut silhouette, one arm raised in a wave. Height ~ 240. */
export const Girl: React.FC<{
  x?: number;
  y?: number;
  scale?: number;
  fill?: string;
  wave?: number;
  opacity?: number;
  facing?: 1 | -1;
}> = ({ x = 0, y = 0, scale = 1, fill = C.plum, wave = 0, opacity = 1, facing = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${facing * scale} ${scale})`} opacity={opacity}>
    <g fill={fill}>
      {/* hair + head */}
      <path d="M -26 -206 C -26 -238 26 -238 26 -206 C 26 -186 20 -176 0 -176 C -20 -176 -26 -186 -26 -206 Z" />
      <path d="M -24 -208 C -34 -170 -30 -140 -22 -126 L -12 -140 C -20 -160 -18 -186 -14 -202 Z" />
      {/* dress */}
      <path d="M -16 -178 C -30 -150 -44 -96 -50 -30 L 50 -30 C 44 -96 30 -150 16 -178 Z" />
      {/* legs */}
      <path d="M -18 -32 L -6 -32 L -5 -2 L -17 -2 Z" />
      <path d="M 6 -32 L 18 -32 L 19 -2 L 7 -2 Z" />
      {/* waving arm */}
      <g transform={`rotate(${wave} 18 -168)`}>
        <path d="M 14 -170 C 30 -168 42 -184 44 -206 L 36 -208 C 33 -190 26 -178 10 -180 Z" />
        <circle cx={40} cy={-210} r={7} />
      </g>
    </g>
  </g>
);

/** Paper whale, origin at the belly, width ~ 520. */
export const Whale: React.FC<{
  x?: number;
  y?: number;
  scale?: number;
  rotate?: number;
  fill?: string;
  fill2?: string;
  opacity?: number;
  spout?: number;
}> = ({ x = 0, y = 0, scale = 1, rotate = 0, fill = C.whale, fill2 = C.whale2, opacity = 1, spout = 0 }) => {
  const d = whalePath();
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`} opacity={opacity}>
      <path d={d} fill={fill} />
      <path d={d} fill="url(#fiber)" opacity={0.28} />
      <path
        d="M -250 0 C -180 30 -40 44 60 40 C 130 36 200 18 246 4 L 246 40 C 180 60 40 70 -90 60 C -180 50 -230 30 -250 0 Z"
        fill={fill2}
        opacity={0.9}
      />
      <path d={d} fill="none" stroke={light(fill, 0.3)} strokeWidth={3} opacity={0.5} />
      <circle cx={150} cy={-56} r={7} fill={C.inkDeep} />
      <path d="M 120 -30 C 150 -18 190 -22 210 -34" stroke={light(fill, 0.35)} strokeWidth={3} fill="none" opacity={0.6} />
      {spout > 0 ? (
        <g opacity={spout} fill={C.foam}>
          <path d={blob(120, -150, 26, 40, 31, 3)} />
          <path d={blob(168, -176, 20, 32, 32, 3)} />
          <path d={blob(76, -168, 17, 27, 33, 3)} />
        </g>
      ) : null}
    </g>
  );
};

/** Sky lantern (?. Origin at the bottom opening. */
export const SkyLantern: React.FC<{
  x: number;
  y: number;
  w?: number;
  h?: number;
  scale?: number;
  glow?: number;
  fill?: string;
  opacity?: number;
  rotate?: number;
}> = ({ x, y, w = 46, h = 62, scale = 1, glow = 1, fill = C.gold2, opacity = 1, rotate = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`} opacity={opacity}>
    {glow > 0 ? <circle cy={-h * 0.5} r={h * 2.2} fill="url(#glGold)" opacity={glow} /> : null}
    <path d={lanternPath(w, h, 11)} fill={fill} />
    <path d={lanternPath(w, h, 11)} fill="none" stroke={light(fill, 0.5)} strokeWidth={2} opacity={0.7} />
    <ellipse cy={h * 0.28} rx={w * 0.3} ry={h * 0.12} fill={C.gold3} opacity={0.55} />
    <path
      d={`M ${-w * 0.4} ${h * 0.46} L ${w * 0.4} ${h * 0.46}`}
      stroke={C.gold3}
      strokeWidth={2.5}
      opacity={0.7}
    />
  </g>
);

export const Sparkle: React.FC<{ x: number; y: number; r: number; fill?: string; opacity?: number }> = ({
  x,
  y,
  r,
  fill = C.cream,
  opacity = 1,
}) => <path d={sparkle(x, y, r)} fill={fill} opacity={opacity} />;

export type PersonKind = 'tall' | 'umbrella' | 'bag' | 'child' | 'couple' | 'hat';

/** Faceless passer-by silhouettes for the pier crowd. */
export const Person: React.FC<{
  x: number;
  y: number;
  scale?: number;
  kind?: PersonKind;
  fill?: string;
  step?: number;
  opacity?: number;
}> = ({ x, y, scale = 1, kind = 'tall', fill = C.plum, step = 0, opacity = 1 }) => {
  const s = scale;
  const swing = Math.sin(step) * 8;
  const body = (
    <>
      <circle cx={0} cy={-150} r={19} />
      <path d={`M -18 -132 C -26 -118 -28 -84 -24 -62 L 24 -62 C 28 -84 26 -118 18 -132 Z`} />
      <path d={`M -22 -64 L -6 -64 L ${-8 + swing * 0.4} -2 L ${-22 + swing * 0.4} -2 Z`} />
      <path d={`M 6 -64 L 22 -64 L ${24 - swing * 0.4} -2 L ${10 - swing * 0.4} -2 Z`} />
    </>
  );
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={opacity}>
      <g fill={fill}>
        {kind === 'hat' ? <path d="M -26 -164 L 26 -164 L 16 -152 L -16 -152 Z" /> : null}
        {body}
        {kind === 'umbrella' ? (
          <>
            <path d="M 16 -120 L 22 -178 L 26 -178 L 22 -120 Z" />
            <path d="M 24 -176 C -30 -178 -70 -150 -74 -116 C -56 -128 -30 -132 -4 -128 C 12 -126 22 -122 24 -116 Z" />
          </>
        ) : null}
        {kind === 'bag' ? <path d="M 22 -96 L 46 -96 L 46 -46 L 22 -46 Z" /> : null}
        {kind === 'couple' ? <circle cx={44} cy={-136} r={16} /> : null}
        {kind === 'couple' ? <path d="M 30 -120 C 24 -100 24 -78 28 -62 L 58 -62 C 62 -80 60 -102 54 -120 Z" /> : null}
        {kind === 'child' ? <path d={`M -28 -64 C -34 -50 -34 -30 -30 -22 L 30 -22 C 34 -30 34 -50 28 -64 Z`} /> : null}
      </g>
    </g>
  );
};

/** Her eye for shot 8; `iris` is a render prop so the inner scene can live inside. */
export const EyeShape: React.FC<{
  cx: number;
  cy: number;
  w: number;
  h: number;
  skin?: string;
  children?: React.ReactNode;
  lid?: number;
}> = ({ cx, cy, w, h, skin = C.dusk2, children, lid = 0 }) => {
  const hw = w / 2;
  const hh = h / 2;
  const almond = `M ${cx - hw} ${cy} C ${cx - hw * 0.55} ${cy - hh}, ${cx + hw * 0.55} ${cy - hh}, ${
    cx + hw
  } ${cy} C ${cx + hw * 0.55} ${cy + hh * 0.92}, ${cx - hw * 0.55} ${cy + hh * 0.92}, ${cx - hw} ${cy} Z`;
  return (
    <g>
      <path d={almond} fill={skin} />
      <path d={almond} fill="url(#fiber)" opacity={0.25} />
      <clipPath id="eyeClip">
        <path d={almond} />
      </clipPath>
      <g clipPath="url(#eyeClip)">{children}</g>
      <path d={almond} fill="none" stroke={light(skin, 0.3)} strokeWidth={3} opacity={0.7} />
      {/* upper lid */}
      <path
        d={`M ${cx - hw} ${cy} C ${cx - hw * 0.55} ${cy - hh - lid}, ${cx + hw * 0.55} ${cy - hh - lid}, ${
          cx + hw
        } ${cy}`}
        fill="none"
        stroke={C.plum}
        strokeWidth={7}
        strokeLinecap="round"
        opacity={0.85}
      />
      {/* lashes */}
      {[-0.7, -0.4, -0.05, 0.32, 0.66].map((u, i) => (
        <path
          key={i}
          d={`M ${cx + u * hw} ${cy - hh * 0.92} L ${cx + u * hw * 1.12} ${cy - hh * 1.22}`}
          stroke={C.plum}
          strokeWidth={5}
          strokeLinecap="round"
          opacity={0.8}
        />
      ))}
    </g>
  );
};
