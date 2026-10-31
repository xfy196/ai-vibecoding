// Film.tsx — the master timeline. Layers read ABSOLUTE time t from useTime(); no <Sequence> remounts,
// so objects that persist across scenes never jump. Each scene decides its own visibility from t.
import React from 'react';
import {AbsoluteFill, Audio, staticFile} from 'remotion';
import {Canvas, EASE, Grain, InkFilter, Paper, Pt, mix, prog, rand, toPath, useTime} from './lib/motion';
import {COLOR, FILM} from './spec';
import {BEAD, MIDR, NEAR, N, RIDGE_BASE, bandPath, beadPts, bloomPts, kf, massPts, MASS_OPACITY} from './lib/film';
import {Scene01} from './scenes/Scene01';
import {Scene02} from './scenes/Scene02';
import {Scene03} from './scenes/Scene03';
import {Scene04} from './scenes/Scene04';
import {Scene05} from './scenes/Scene05';

const toBead = (pts: Pt[], p: number, r: number): Pt[] => {
  if (p <= 0) return pts;
  const b = beadPts(BEAD[0], BEAD[1], r);
  return pts.map(([x, y], i) => [mix(x, b[i][0], p), mix(y, b[i][1], p)] as Pt);
};

// A wash has no outline. It is densest under its crest and dies out at the bottom, where the brush ran
// out of water, and at both ends, where it lifted. Two masks, nested, so the fades multiply instead of
// painting each other back in; each one runs to nothing through a torn turbulence edge.
const Wash: React.FC<{id: string; pts: Pt[]; op: number; base: number; filter: string; stroke: number}> = ({id, pts, op, base, filter, stroke}) => {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), yTop = Math.min(...ys) - 30, yBot = Math.max(...ys) + 20;
  const d = toPath(pts);
  const crest = toPath(pts.slice(0, N / 2), false);
  const endW = Math.min(200, (x1 - x0) * 0.22);
  const vy1 = base - 118, vy2 = base - 26, H = yBot - yTop;
  return (
    <g opacity={op} mask={`url(#ms-${id})`}>
      <g mask={`url(#mb-${id})`}>
        <defs>
          <linearGradient id={`gv-${id}`} x1="0" y1={vy1} x2="0" y2={vy2} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#000000" />
          </linearGradient>
          <linearGradient id={`gl-${id}`} x1={x0 - 20} y1="0" x2={x0 + endW} y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#000000" /><stop offset="1" stopColor="#ffffff" />
          </linearGradient>
          <linearGradient id={`gr-${id}`} x1={x1 - endW} y1="0" x2={x1 + 20} y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#000000" />
          </linearGradient>
          <filter id={`d-${id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.009 0.016" numOctaves="3" seed={17} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="54" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <mask id={`mb-${id}`} maskUnits="userSpaceOnUse" x="0" y="0" width="1920" height="1080">
            <g filter={`url(#d-${id})`}>
              <rect x={x0 - 40} y={yTop} width={x1 - x0 + 80} height={H} fill="#ffffff" />
              <rect x={x0 - 40} y={vy1} width={x1 - x0 + 80} height={yBot - vy1 + 40} fill={`url(#gv-${id})`} />
            </g>
          </mask>
          <mask id={`ms-${id}`} maskUnits="userSpaceOnUse" x="0" y="0" width="1920" height="1080">
            <g filter={`url(#d-${id})`}>
              <rect x={x0 - 40} y={yTop} width={x1 - x0 + 80} height={H} fill="#ffffff" />
              <rect x={x0 - 40} y={yTop} width={endW + 40} height={H} fill={`url(#gl-${id})`} />
              <rect x={x1 - endW} y={yTop} width={endW + 40} height={H} fill={`url(#gr-${id})`} />
            </g>
          </mask>
        </defs>
        <path d={d} fill={COLOR.wash} filter={`url(#${filter})`} />
        {/* ink pools at the ridge line: a darker crest, not a contour round the whole shape */}
        <path d={crest} fill="none" stroke={COLOR.wash} strokeWidth={stroke} opacity={0.9} strokeLinejoin="round" filter={`url(#${filter})`} />
      </g>
    </g>
  );
};

// E11 mist: cloud sits between the ranges, never across the nearest one — thin paper-coloured strokes that
// only touch the washes behind the near ridge.
const Mist: React.FC<{t: number}> = ({t}) => {
  const vis = prog(t, 5.0, 1.1, EASE.smooth) * (1 - prog(t, 12.6, 0.8, EASE.smooth));
  if (vis <= 0.001) return null;
  const drift = (k: number) => 12 * Math.sin(t * 0.22 + k) + (t - 9) * 1.6;
  return (
    <g opacity={0.34 * vis}>
      <InkFilter id="inkMist" edge={4} freq={0.02} grain={0.3} seed={41} boil={1} />
      <g filter="url(#inkMist)">
        <path d={bandPath(742, 640, 1600, 13, 'm2', drift(2), 18, 2.1)} fill={COLOR.paper} />
        <path d={bandPath(806, 700, 1520, 9, 'm3', drift(4), 26, 4.0)} fill={COLOR.paper} />
      </g>
    </g>
  );
};

// E10 The ink: one mass plus three washes, alive from the first frame to the last. Never remounted.
const Ink: React.FC<{t: number}> = ({t}) => {
  const pts = massPts(t);
  // the dry edge has to scale with the object: an 8 px seed and a 1100 px wash cannot share one filter
  const span = Math.max(...pts.map((p) => p[0])) - Math.min(...pts.map((p) => p[0]));
  const small = span < 320;
  const mass = toPath(pts);
  const mOp = kf(t, MASS_OPACITY);
  const mid = toBead(bloomPts(MIDR, 740, prog(t, 4.4, 1.1, EASE.out)), prog(t, 9.85, 0.95, EASE.inOut), 30);
  const near = toBead(bloomPts(NEAR, 820, prog(t, 5.3, 1.1, EASE.out)), prog(t, 9.65, 0.95, EASE.inOut), 30);
  const midOp = kf(t, [[4.4, 0], [5.6, 0.3], [9.85, 0.3], [10.8, 0]]);
  const nearOp = kf(t, [[5.3, 0], [6.5, 0.82], [9.65, 0.82], [10.6, 0]]);
  // the mass only dries out at the bottom while it is a wash, not while it is a drop or a bead
  const massBase = kf(t, [[0, 3000], [1.7, 3000], [2.9, RIDGE_BASE.far], [9.6, RIDGE_BASE.far], [10.2, 3000]]);
  return (
    <g>
      <InkFilter id="inkDrop" edge={3} freq={0.045} grain={0.2} seed={2} />
      <InkFilter id="inkFar" edge={13} freq={0.007} grain={0.16} seed={3} />
      <InkFilter id="inkMid" edge={11} freq={0.009} grain={0.2} seed={5} />
      <InkFilter id="inkNear" edge={9} freq={0.011} grain={0.26} seed={7} boil={1} />
      <Wash id="mass" pts={pts} op={mOp} base={massBase} filter={small ? 'inkDrop' : 'inkFar'} stroke={small ? 1.4 : 6} />
      {midOp > 0.001 && <Wash id="mid" pts={mid} op={midOp} base={RIDGE_BASE.mid} filter="inkMid" stroke={5} />}
      <Mist t={t} />
      {nearOp > 0.001 && <Wash id="near" pts={near} op={nearOp} base={RIDGE_BASE.near} filter="inkNear" stroke={10} />}
    </g>
  );
};

// E11 Air: mist lying on the washes in paper colour, two birds, one hairline rule. All born and gone inside the loop.
const Air: React.FC<{t: number}> = ({t}) => {
  const inOut = prog(t, 5.0, 1.1, EASE.smooth) * (1 - prog(t, 12.8, 0.8, EASE.smooth));
  const birds = prog(t, 5.6, 0.7, EASE.out) * (1 - prog(t, 9.2, 0.7, EASE.smooth));
  const rule = prog(t, 6.0, 0.8, EASE.out) * (1 - prog(t, 12.9, 0.7, EASE.smooth));
  const drift = (seed: string, k: number) => 10 * Math.sin(t * 0.22 + k) + (t - 9) * 1.2;
  return (
    <g>
      {birds > 0.001 && (
        <g opacity={0.55 * birds} stroke={COLOR.wash} strokeWidth={2.6} fill="none" strokeLinecap="round">
          {[[1524, 300, 0], [1612, 336, 1.2]].map(([x, y, ph], i) => (
            <path key={i} d={`M${x - 140 * (t - 5.6) / 4 + 0} ${y} q 8 -8 16 0 q 8 -8 16 0`} transform={`translate(0 ${Math.sin(t * 0.5 + ph) * 5})`} />
          ))}
        </g>
      )}
      {rule > 0.001 && (
        <g opacity={0.3 * rule}>
          <line x1={1704} y1={244} x2={1704} y2={244 + 208 * rule} stroke={COLOR.ink} strokeWidth={2.2} strokeLinecap="round" />
          <line x1={1704} y1={244} x2={1740} y2={244} stroke={COLOR.ink} strokeWidth={2.2} strokeLinecap="round" />
        </g>
      )}
    </g>
  );
};

export const Film: React.FC = () => {
  const {t} = useTime();
  return (
    <AbsoluteFill style={{backgroundColor: COLOR.paper}}>
      <Paper color={COLOR.paper} grain={0.12} fibre={0.09} />
      <Canvas>
        <Ink t={t} />
        <Air t={t} />
      </Canvas>
      <Scene01 t={t} />
      <Scene02 t={t} />
      <Scene03 t={t} />
      <Scene04 t={t} />
      <Scene05 t={t} />
      <Grain opacity={0.05} freq={0.8} seed={9} />
      {FILM.sound && <Audio src={staticFile('score.wav')} />}
    </AbsoluteFill>
  );
};
