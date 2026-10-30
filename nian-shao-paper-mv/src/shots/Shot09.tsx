import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { clamp, easeInOut, lerp, pulse, ramp, rampEased, rng, springIn, wobble } from '../anim';
import { Camera, Glow, GrainOverlay, Paper, Svg, Vignette, Wash } from '../paper/Paper';
import { P, rrect, tornRect } from '../paper/edges';
import { Chair, Figure, Glass, PaperChar, Scrap, Table } from '../paper/figures';
import { BEAT, C, FPS, light, mix } from '../theme';

/**
 * ⑨ 极简留白 — 4:14.22–4:39.15　「在婚礼上多喝几杯 祝我年少有为」
 *
 * After everyone has gone: the hall from above, scattered chairs, one table
 * still lit by one lamp, and him drinking alone. The camera pulls back until
 * the whole scene turns out to have been a sheet of paper on a table; a red seal
 * comes down on it — 祝我年少有为 — and then the sheet is lifted away.
 */

const T = 254.22;
const at = (sec: number) => Math.round((sec - T) * FPS);

const SHEET = tornRect({ x: 4, y: 4, w: 1912, h: 1072, top: 7, bottom: 9, left: 5, right: 5, step: 34, seed: 1901 });

export const Shot09: React.FC<{ t0: number }> = ({ t0 }) => {
  const frame = useCurrentFrame();
  const g = frame + t0;

  // he drinks twice, then sets it down
  const sip1 = rampEased(frame, at(254.4), at(256.2), 0, 1, easeInOut);
  const set1 = rampEased(frame, at(256.4), at(257.6), 0, 1, easeInOut);
  const sip2 = rampEased(frame, at(258.0), at(259.4), 0, 1, easeInOut);
  const set2 = rampEased(frame, at(259.6), at(261.0), 0, 1, easeInOut);
  const armK = Math.max(sip1 * (1 - set1), sip2 * (1 - set2));

  // the pull-back: the scene becomes a sheet of paper
  const pull = rampEased(frame, at(261.4), at(270.4), 1.12, 0.58, easeInOut);
  const lift = rampEased(frame, at(270.6), at(272.8), 0, 1, easeInOut);
  const sheetRot = -0.5 + lift * 1.6 + wobble(g, 12, 0.004, 0.15);
  const sheetY = lift * -40;

  // the seal
  const stamp = springIn(g, t0 + at(267.0), { damping: 18, stiffness: 220 });
  const stampFlash = frame >= at(267.0) ? 1 - clamp((frame - at(267.0)) / 12) : 0;
  const ink = clamp((frame - at(267.0)) / 8);

  // the sheet is lifted off the table
  const off = rampEased(frame, at(273.4), at(276.6), 0, -1400, easeInOut);

  // end card
  const card = ramp(frame, at(276.0), at(277.6), 0, 1);
  const cardOut = ramp(frame, at(279.0), at(279.147), 0, 1);

  return (
    <AbsoluteFill style={{ backgroundColor: '#07080a' }}>
      <Svg>
        <defs>
          <clipPath id="s9clip">
            <path d={SHEET} />
          </clipPath>
          <linearGradient id="s9floor" x1="0" y1="0" x2="0.1" y2="1">
            <stop offset="0%" stopColor="#15161b" />
            <stop offset="55%" stopColor="#0e0f13" />
            <stop offset="100%" stopColor="#07080a" />
          </linearGradient>
          <radialGradient id="s9lamp" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor={C.gold2} stopOpacity="0.55" />
            <stop offset="100%" stopColor={C.gold} stopOpacity="0" />
          </radialGradient>
        </defs>

        <Camera scale={pull} rotate={sheetRot} y={off + sheetY} originX={960} originY={540}>
          {/* the paper's shadow on the table */}
          <g transform="translate(10 30)" opacity={0.65 * clamp((1 - pull) / 0.4)}>
            <path d={SHEET} fill="#000" />
          </g>

          <g clipPath="url(#s9clip)">
            {/* floor of the empty hall, seen from above */}
            <rect width={1920} height={1080} fill="url(#s9floor)" />
            <path d={P([[-40, 300], [1960, 300], [1960, 1120], [-40, 1120]])} fill={mix(C.ink3, C.black, 0.55)} opacity={0.55} />
            {new Array(7).fill(0).map((_, i) => (
              <line key={i} x1={-40 + i * 320} y1={300} x2={-160 + i * 380} y2={1120} stroke="#000" strokeWidth={3} opacity={0.18} />
            ))}

            {/* one lamp still on, over the one occupied table */}
            <Glow x={1120} y={560} r={620} fill="url(#s9lamp)" opacity={0.55 + 0.1 * pulse(g, BEAT * 2, 2)} />
            <path d={P([[1060, 0], [1180, 0], [1420, 780], [790, 780]])} fill={C.gold2} opacity={0.055} />

            {/* scattered chairs, one knocked over */}
            {[
              { x: 420, y: 560, r: -8 },
              { x: 700, y: 500, r: 12 },
              { x: 300, y: 780, r: 26 },
              { x: 620, y: 900, r: -14 },
              { x: 1520, y: 560, r: 8 },
              { x: 1690, y: 760, r: -22 },
              { x: 1180, y: 980, r: 84 },
            ].map((c, i) => (
              <Chair key={i} h={110} x={c.x} y={c.y} fill={mix(C.red3, C.black, 0.45)} rot={c.r} shadow="mid" />
            ))}

            {/* the table he is still sitting at */}
            <g transform="translate(1180 720) rotate(-2)">
              <Table w={440} h={120} cloth={mix(C.paper2, C.red3, 0.45)} top={mix(C.paper, C.gold, 0.12)} shadow="deep" />
              {/* the one glass */}
              <g transform="translate(60 ${-120 - armK * 40})">
                <Glass h={110} fill={mix(C.ice, C.paper, 0.4)} liquid={mix(C.red3, C.redDeep, 0.5)} liquidTop={0.4} />
              </g>
              {/* a plate, a bottle */}
              <Paper d={`M-110 -128 A70 22 0 1 1 50 -128 A70 22 0 1 1 -110 -128 Z`} fill={mix(C.paper, C.gold, 0.1)} shadow="near" tex={0.3} />
              <Paper d={P([[-20, -124], [16, -124], [10, -206], [-14, -206]])} fill={mix(C.ink2, C.kraft2, 0.2)} shadow="mid" tex={0.4} edge={true} />
            </g>

            {/* him, alone, back to us, drinking */}
            <g transform="translate(1180 760)">
              <Figure h={200} x={-40} y={10} fill="#05060a" pose="sit" shadow="soft" rim={mix(C.gold, C.black, 0.4)} />
              {armK > 0.05 ? (
                <g opacity={armK}>
                  <Paper d={rrect(-6, -300, 40, 96, 16)} fill="#05060a" shadow="none" tex={0.2} transform="rotate(-18 10 -250)" />
                </g>
              ) : null}
            </g>

            {/* paper scraps on the floor */}
            {new Array(18).fill(0).map((_, i) => {
              const r = rng(17000 + i);
              return <Scrap key={i} x={r() * 1900} y={380 + r() * 660} size={8 + r() * 16} fill={mix(C.paper3, C.ink2, r() * 0.7)} seed={17100 + i} rot={r() * 360} opacity={0.45} />;
            })}

            <Vignette opacity={1.4} />
            <GrainOverlay opacity={0.18} dust={0.24} />
          </g>

          {/* the paper edge: a lit rim all the way round the sheet */}
          <path d={SHEET} fill="none" stroke={mix(C.paper2, C.gold, 0.15)} strokeWidth={5} opacity={0.5} />
          <path d={SHEET} fill="none" stroke="#000" strokeWidth={2} opacity={0.4} transform="translate(2 3)" />

          {/* the seal: 祝我年少有为, stamped into the bottom-right corner */}
          <g transform={`translate(1430 862) rotate(-6) scale(${lerp(2.2, 1, clamp(stamp))})`} opacity={clamp(stamp * 1.4)}>
            <Paper d={tornRect({ x: -132, y: -132, w: 264, h: 264, top: 5, bottom: 5, left: 5, right: 5, step: 18, seed: 2101 })} fill={C.red} shadow="soft" tex={0.55} edge={light(C.red, 0.18)} />
            <Paper d={tornRect({ x: -112, y: -112, w: 224, h: 224, top: 3, bottom: 3, left: 3, right: 3, step: 16, seed: 2111 })} fill="none" shadow="none" edge={mix(C.paper, C.red, 0.25)} edgeWidth={5} tex={0} opacity={0.55 * ink} />
            <PaperChar text="祝我" size={78} fill={mix(C.paper, C.red, 0.1)} x={0} y={-58} opacity={ink} />
            <PaperChar text="年少有为" size={52} fill={mix(C.paper, C.red, 0.1)} x={0} y={14} opacity={ink} />
            <PaperChar text="2026" size={26} fill={mix(C.paper, C.red, 0.25)} x={0} y={70} opacity={0.8 * ink} />
          </g>
          <rect width={1920} height={1080} fill={C.paper} opacity={0.25 * stampFlash} style={{ mixBlendMode: 'screen' }} />
        </Camera>

        {/* end card */}
        <g opacity={card * (1 - cardOut)}>
          <PaperChar text="祝我年少有为" size={92} fill={mix(C.paper, C.gold, 0.2)} x={960} y={470} letterSpacing={10} />
          <PaperChar text="李荣浩《年少有为》· 层叠剪纸 MV" size={30} fill={mix(C.paper, C.slate, 0.55)} x={960} y={580} letterSpacing={6} />
        </g>
      </Svg>
    </AbsoluteFill>
  );
};
