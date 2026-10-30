import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { clamp, easeInOut, lerp, pulse, ramp, rampEased, rng, springIn, stagger, wobble } from '../anim';
import { Camera, GrainOverlay, Paper, Svg, Vignette, Wash } from '../paper/Paper';
import { P, crescent, rrect, tornRect } from '../paper/edges';
import { ClockFace, Figure, PaperChar, Scrap } from '../paper/figures';
import { BEAT, C, FPS, light, mix } from '../theme';

/**
 * ② 俯视平铺 — 0:30.00–1:00.56　「电视已经闪 / 联络方式都还没删」
 *
 * Ninety degrees straight down onto a desk: the whole relationship laid out
 * flat like evidence. A phone that will not stop buzzing, a photo torn in two,
 * a blank sheet that slowly draws the home they wanted, a clock spinning day
 * into night, and a stack of money that comes up one bill short.
 */

const T = 30; // shot starts at 0:30.00
const at = (sec: number) => Math.round((sec - T) * FPS);

const HAND =
  'M-30 300 L-32 44 C-52 28 -58 -6 -44 -24 C-40 -50 -30 -88 -22 -120 C-18 -136 0 -134 2 -118 L10 -42 L18 -42 L20 -152 C22 -168 42 -166 42 -150 L38 -42 L46 -42 L50 -134 C52 -150 72 -148 70 -132 L64 -40 L72 -40 L76 -98 C78 -112 96 -110 94 -96 L88 -18 C86 24 74 60 70 98 L70 300 Z';

export const Shot02: React.FC<{ t0: number }> = ({ t0 }) => {
  const frame = useCurrentFrame();
  const g = frame + t0;

  // camera: a slow sink onto the table, drifting right
  const scale = rampEased(frame, 0, 917, 1.07, 1.0, easeInOut);
  const camX = ramp(frame, 0, 917, -20, 26);

  // TV corner, top-left, throwing its flicker across the desk
  const tvFlash = frame > at(30) ? 0.4 + 0.6 * pulse(g, BEAT / 2, 2) : 0;
  const tvLight = clamp(frame > at(30) ? 1 - (frame - at(30)) / at(2.0) : 0) * 0.5 + 0.12 * tvFlash;

  // contacts scroll out of the phone
  const contactN = 12;
  const contact = (i: number) => stagger(frame, at(33.3), 12, i, 6.9);

  // the photo gets torn on "我却措手毁掉"
  const handIn = springIn(g, t0 + at(36.4), { damping: 17, stiffness: 55 });
  const tear = rampEased(frame, at(37.3), at(37.9), 0, 1, easeInOut);
  const handOut = rampEased(frame, at(37.9), at(39.4), 0, 1, easeInOut);

  // blank sheet -> drawn house
  const sheetIn = springIn(g, t0 + at(43.8), { damping: 16, stiffness: 80 });
  const draw = ramp(frame, at(47.58), at(52.4), 0, 1);

  // clock: day and night alternating
  const clockIn = springIn(g, t0 + at(50.7), { damping: 14, stiffness: 120 });
  const dnOn = frame > at(50.88) && frame < at(55.5);
  const dayNight = dnOn ? Math.floor((frame - at(50.88)) / 18) % 2 : 0;
  const dnWash = dnOn ? clamp(1 - ((frame - at(50.88)) % 18) / 5) : 0;

  // money: seven bills, the eighth is blank
  const bills = 8;
  const billAt = (i: number) => stagger(frame, at(55.1), 8, i, 7.5);

  // the table is covered by a fresh sheet at the end
  const cover = rampEased(frame, at(59.3), at(60.2), -1200, 0, easeInOut);

  return (
    <AbsoluteFill style={{ backgroundColor: '#0d1c22' }}>
      <Svg>
        <defs>
          <radialGradient id="s2light" cx="0.1" cy="0.05" r="0.9">
            <stop offset="0%" stopColor={C.ice} stopOpacity="0.5" />
            <stop offset="55%" stopColor={C.ice} stopOpacity="0.12" />
            <stop offset="100%" stopColor={C.ice} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="s2desk" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={mix(C.teal2, C.ink1, 0.25)} />
            <stop offset="60%" stopColor={C.teal2} />
            <stop offset="100%" stopColor={mix(C.teal, C.teal2, 0.4)} />
          </linearGradient>
        </defs>

        <Camera scale={scale} x={camX} y={0}>
          <g transform="rotate(-2.6 960 540)">
            {/* the desk sheet itself */}
            <Paper
              d={tornRect({ x: -60, y: -60, w: 2040, h: 1210, top: 6, bottom: 6, left: 6, right: 6, step: 40, seed: 21 })}
              fill="url(#s2desk)"
              shadow="none"
              tex={0.55}
            />

            <rect width={1920} height={1080} fill="url(#s2light)" style={{ mixBlendMode: 'screen' }} opacity={0.8} />
            <rect width={1920} height={1080} fill={C.ice} opacity={tvLight * 0.5} style={{ mixBlendMode: 'screen' }} />

            {/* ---- the TV, hanging off the top edge of the table ---- */}
            <g transform="translate(180 -40)">
              <Paper d={rrect(0, 0, 460, 240, 26)} fill={mix(C.ink1, C.black, 0.3)} shadow="soft" tex={0.4} edge={light(C.ink1, 0.2)} />
              <rect x={26} y={22} width={408} height={196} rx={12} fill={C.ice} opacity={0.1 + 0.35 * tvFlash} />
              <rect
                x={26}
                y={22}
                width={408}
                height={196}
                rx={12}
                fill="url(#grain)"
                opacity={0.18 + 0.22 * pulse(g, 3, 2)}
                style={{ mixBlendMode: 'screen' }}
              />
            </g>

            {/* ---- phone, screen lit, contact strips sliding out ---- */}
            <g transform="translate(400 430) rotate(-13)">
              <Paper d={rrect(-150, -300, 300, 600, 44)} fill={mix(C.ink1, C.black, 0.2)} shadow="soft" tex={0.3} />
              <rect x={-128} y={-268} width={256} height={536} rx={22} fill={mix(C.ice, C.ink1, 0.55)} opacity={0.95} />
              <rect x={-128} y={-268} width={256} height={536} rx={22} fill={C.ice} opacity={0.26} style={{ mixBlendMode: 'screen' }} />
              <PaperChar text="联络方式" size={30} fill={mix(C.ink1, C.paper, 0.25)} y={-236} />
              {new Array(contactN).fill(0).map((_, i) => {
                const k = contact(i);
                if (k <= 0.01) return null;
                return (
                  <g key={i} transform={`translate(${-104 + (1 - k) * 40} ${-186 + i * 44})`} opacity={k}>
                    <rect width={208} height={36} rx={7} fill={C.paper} opacity={0.92} />
                    <circle cx={20} cy={18} r={9} fill={mix(C.teal2, C.ink1, 0.3)} opacity={0.8} />
                    <rect x={38} y={15} width={124 - (i % 3) * 18} height={7} rx={3.5} fill={mix(C.ink1, C.teal2, 0.55)} opacity={0.75} />
                  </g>
                );
              })}
              {/* the one name she left in, circled in red */}
              <g opacity={clamp((frame - at(35.5)) / 10)}>
                <ellipse cx={0} cy={-186 + 44 + 18} rx={122} ry={30} fill="none" stroke={C.red} strokeWidth={5} opacity={0.92} />
              </g>
            </g>

            {/* ---- the photograph, torn in two ---- */}
            <g transform="translate(880 800) rotate(7)">
              <g opacity={1 - tear * 0.9}>
                <Paper d={tornRect({ x: -170, y: -120, w: 340, h: 240, top: 4, bottom: 4, left: 4, right: 4, step: 18, seed: 33 })} fill={C.paper2} shadow="soft" tex={0.4} />
                <rect x={-146} y={-98} width={292} height={196} fill={mix(C.teal2, C.ink2, 0.3)} />
                <rect x={-40} y={-84} width={80} height={110} fill={C.gold2} opacity={0.85} />
                <rect x={-4} y={-84} width={5} height={110} fill={mix(C.ink1, C.teal2, 0.4)} />
                <rect x={-40} y={-32} width={80} height={5} fill={mix(C.ink1, C.teal2, 0.4)} />
                <Figure h={104} fill={mix(C.ink1, C.black, 0.35)} x={-66} y={92} />
                <Figure h={96} fill={mix(C.ink1, C.black, 0.35)} x={58} y={92} flip />
                <rect x={-170} y={-120} width={340} height={240} fill="none" stroke={light(C.paper2, 0.3)} strokeWidth={3} />
              </g>
            </g>
            {/* the right half is dragged away along the diagonal */}
            <g transform={`translate(${880 + handOut * 560} ${800 - handOut * 320}) rotate(${7 + handOut * 40})`} opacity={tear}>
              <Paper d={P([[0, -120], [170, -120], [170, 120], [0, 120], [-14, 40], [18, -20], [-10, -70]])} fill={C.paper2} shadow="soft" tex={0.4} edge={true} />
            </g>
            <g transform="translate(880 800) rotate(7)" opacity={tear}>
              <Paper d={P([[-170, -120], [0, -120], [-10, -70], [18, -20], [-14, 40], [0, 120], [-170, 120]])} fill={C.paper2} shadow="soft" tex={0.4} edge={true} />
            </g>

            {/* ---- the hand that did it ---- */}
            <g
              transform={`translate(${1180 + (1 - handIn) * 520 - handOut * 340} ${1120 + (1 - handIn) * 420 - handOut * 660}) rotate(-24)`}
              opacity={clamp(handIn * 1.2) * (1 - handOut * 0.2)}
            >
              <Paper d={HAND} fill={mix(C.ink1, C.black, 0.45)} shadow="deep" tex={0.3} />
            </g>

            {/* ---- ashtray, keys, scraps ---- */}
            <g transform="translate(1500 860)">
              <Paper d={`M-96 0 A96 96 0 1 1 96 0 A96 96 0 1 1 -96 0 Z`} fill={mix(C.teal2, C.ink1, 0.15)} shadow="soft" tex={0.4} edge={true} />
              <circle cx={0} cy={0} r={66} fill={mix(C.ink1, C.black, 0.35)} opacity={0.55} />
              {[
                [-30, -30, -22],
                [34, -10, -40],
                [-6, 40, 8],
              ].map(([x, y, r], i) => (
                <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
                  <rect x={0} y={-6} width={64} height={12} rx={6} fill={C.paper3} opacity={0.9} />
                  <rect x={44} y={-6} width={20} height={12} rx={6} fill={C.ink1} opacity={0.5} />
                </g>
              ))}
            </g>

            {/* ---- the blank sheet that draws the home they imagined ---- */}
            <g transform={`translate(1330 ${290 + (1 - sheetIn) * 260}) rotate(-4)`} opacity={clamp(sheetIn * 1.2)}>
              <Paper d={tornRect({ x: -260, y: -190, w: 520, h: 380, top: 5, bottom: 5, left: 5, right: 5, step: 22, seed: 44 })} fill={C.paper} shadow="soft" tex={0.5} edge={true} />
              {[0, 1, 2, 3, 4].map((i) => (
                <line key={i} x1={-230} y1={-140 + i * 66} x2={230} y2={-140 + i * 66} stroke={mix(C.ice, C.teal2, 0.6)} strokeWidth={2} opacity={0.35} />
              ))}
              <g stroke={mix(C.ink1, C.slate, 0.3)} strokeWidth={4} fill="none" strokeLinecap="round" opacity={0.9}>
                <path d={P([[-150, 60], [-150, -40], [0, -130], [150, -40], [150, 60], [-150, 60]])} strokeDasharray={620} strokeDashoffset={620 * (1 - clamp(draw * 1.15))} />
                <path d={P([[-40, 60], [-40, -10], [40, -10], [40, 60]])} strokeDasharray={220} strokeDashoffset={220 * (1 - clamp((draw - 0.45) * 2))} />
                <path d={P([[70, -10], [110, -10], [110, 20], [70, 20], [70, -10]])} strokeDasharray={180} strokeDashoffset={180 * (1 - clamp((draw - 0.6) * 2.4))} />
              </g>
              <g opacity={clamp((draw - 0.75) * 4)}>
                <PaperChar text="首付？" size={44} fill={C.red} x={150} y={130} rot={-6} />
              </g>
            </g>

            {/* ---- the clock that spins day into night ---- */}
            <g transform={`translate(1560 640) scale(${lerp(0.9, 1, clamp(clockIn))}) rotate(${-8 + wobble(g, 4, 0.01, 2)})`} opacity={clamp(clockIn * 1.3)}>
              <ClockFace r={96} face={C.paper2} ink={mix(C.ink1, C.slate, 0.2)} hand={(frame - at(50.88)) * 0.05} />
            </g>

            {/* ---- money, one bill short ---- */}
            <g transform="translate(300 850) rotate(9)">
              {new Array(bills).fill(0).map((_, i) => {
                const k = billAt(i);
                if (k <= 0) return null;
                const blank = i === bills - 1;
                return (
                  <g key={i} transform={`translate(${(1 - k) * -40} ${-i * 7 - (1 - k) * 30}) rotate(${(1 - k) * -18})`} opacity={k}>
                    <Paper d={rrect(0, 0, 300, 130, 6)} fill={blank ? C.paper : mix(C.paper2, C.kraft, 0.2)} shadow="near" tex={0.35} edge={true} />
                    {!blank ? (
                      <>
                        <rect x={18} y={18} width={264} height={94} rx={4} fill="none" stroke={mix(C.moss, C.ink1, 0.3)} strokeWidth={2} opacity={0.5} />
                        <circle cx={46} cy={65} r={22} fill="none" stroke={mix(C.moss, C.ink1, 0.2)} strokeWidth={2} opacity={0.5} />
                        <rect x={150} y={40} width={104} height={8} rx={4} fill={mix(C.moss, C.ink1, 0.2)} opacity={0.4} />
                        <rect x={150} y={62} width={72} height={8} rx={4} fill={mix(C.moss, C.ink1, 0.2)} opacity={0.35} />
                      </>
                    ) : (
                      <PaperChar text="不够" size={40} fill={mix(C.red, C.paper, 0.15)} x={150} y={68} rot={-3} />
                    )}
                  </g>
                );
              })}
            </g>

            {/* scraps */}
            {new Array(9).fill(0).map((_, i) => {
              const r = rng(600 + i);
              return (
                <Scrap
                  key={i}
                  x={180 + r() * 1560}
                  y={140 + r() * 820}
                  size={10 + r() * 16}
                  fill={mix(C.paper3, C.teal2, r() * 0.5)}
                  seed={700 + i}
                  rot={r() * 360}
                  opacity={0.5}
                />
              );
            })}

            {/* day / night wash on the "熬" beat */}
            {dayNight === 1 ? <Wash color={C.ice} opacity={0.16 * dnWash} blend="screen" /> : <Wash color={C.ink1} opacity={0.3 * dnWash} blend="multiply" />}
          </g>

          <Vignette opacity={0.85} />
          <GrainOverlay opacity={0.17} dust={0.2} />
        </Camera>

        {/* a fresh sheet covers the table; the keys stay on top, alone */}
        <g transform={`translate(0 ${cover})`}>
          <Paper d={tornRect({ x: -20, y: -10, w: 1960, h: 1100, top: 12, bottom: 12, left: 4, right: 4, step: 34, seed: 88 })} fill={mix(C.paper, C.paper2, 0.4)} shadow="deep" tex={0.5} />
        </g>
        <g transform="translate(1010 620) rotate(-16)" opacity={clamp(ramp(frame, at(59.5), at(60.0)))}>
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(${i * 18} ${i * 7}) rotate(${i * 15})`}>
              <Paper d={rrect(0, 0, 104, 24, 9)} fill={mix(C.kraft, C.paper3, 0.35)} shadow="near" tex={0.3} />
              <circle cx={11} cy={12} r={7.5} fill={mix(C.teal2, C.ink1, 0.2)} />
            </g>
          ))}
        </g>

        <Wash color={C.black} opacity={ramp(frame, at(60.3), at(60.56), 0, 1)} blend="normal" />
      </Svg>
    </AbsoluteFill>
  );
};
