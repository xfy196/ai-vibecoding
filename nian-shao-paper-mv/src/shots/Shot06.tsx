import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { clamp, easeInOut, lerp, pulse, ramp, rampEased, rng, springIn, wobble } from '../anim';
import { Camera, Glow, GrainOverlay, Paper, Svg, Vignette, Wash } from '../paper/Paper';
import { P, crackPath, crescent, rrect, shard, tornRect } from '../paper/edges';
import { Bowl, Chair, Chopstick, ClockFace, Figure, PaperChar, Scrap, Steam } from '../paper/figures';
import { BEAT, C, FPS, light, mix } from '../theme';

/**
 * ⑥ 房屋剖面 — 2:25.58–3:08.80　「也曾一起想 有个地方睡觉吃饭」
 *
 * The home they talked about, sliced open like a doll's house: a bedroom, a
 * living room with two bowls on the table, a kitchen with a pot on the stove.
 * The camera tracks across the rooms; each one lights up as we arrive and goes
 * dark behind us. One person lives in it.
 */

const T = 145.58;
const at = (sec: number) => Math.round((sec - T) * FPS);

const HX = 180;
const HX2 = 1740;
const FLOOR = 880;
const CEIL = 420;
const PEAK = 196;

/** piecewise linear progress through [[frame,value],…] */
const piecewise = (frame: number, pts: [number, number][]) => {
  if (frame <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (frame <= pts[i][0]) {
      const [f0, v0] = pts[i - 1];
      const [f1, v1] = pts[i];
      return lerp(v0, v1, (frame - f0) / Math.max(1, f1 - f0));
    }
  }
  return pts[pts.length - 1][1];
};

export const Shot06: React.FC<{ t0: number }> = ({ t0 }) => {
  const frame = useCurrentFrame();
  const g = frame + t0;

  // the camera tracks across the rooms with two small holds
  const p = piecewise(frame, [
    [at(145.58), 0],
    [at(152.4), 0.34],
    [at(155.6), 0.36],
    [at(167.0), 0.72],
    [at(170.2), 0.74],
    [at(181.6), 1],
    [at(188.8), 1],
  ]);
  const camX = lerp(170, -170, p) + 2 * wobble(g, 9, 0.004, 1);
  const camScale = 1.05 - 0.02 * p + 0.006 * Math.sin(frame * 0.011);

  // day / night flicker in the bedroom window
  const dnFrom = at(152.66);
  const dnTo = at(158.6);
  const dn = frame > dnFrom && frame < dnTo ? Math.floor((frame - dnFrom) / 20) % 2 : 1;

  // the crack in the wall on "墙板被我砸烂"
  const crackK = rampEased(frame, at(162.36), at(164), 0, 1, easeInOut);
  const wallDrop = rampEased(frame, at(165.4), at(169), 0, 70, easeInOut);

  // the bowl in the kitchen: half, with steam
  const bowlK = ramp(frame, at(167.16), at(168.6), 0, 1);
  const bagK = springIn(g, t0 + at(171.68), { damping: 14, stiffness: 90 });

  // window turns red on "你常常眼睛挥红"
  const redK = rampEased(frame, at(176.88), at(178.4), 0, 1, easeInOut);
  const redOut = rampEased(frame, at(180.4), at(182.4), 0, 1, easeInOut);

  // all the lights go out on "原来心疼我"
  const outK = rampEased(frame, at(181.9), at(184.5), 0, 1, easeInOut);

  // "家" falls off the wall at the end
  const fallK = rampEased(frame, at(184.6), at(187.6), 0, 1, easeInOut);

  const lamp = (max: number) => Math.max(0.12, 1 - outK * 0.88) * max;

  return (
    <AbsoluteFill style={{ backgroundColor: '#140d08' }}>
      <Svg>
        <defs>
          <linearGradient id="s6sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0b0f18" />
            <stop offset="100%" stopColor="#1b2233" />
          </linearGradient>
          <linearGradient id="s6room" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={mix(C.paper3, C.kraft2, 0.34)} />
            <stop offset="100%" stopColor={mix(C.paper3, C.kraft2, 0.46)} />
          </linearGradient>
          <linearGradient id="s6floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={mix(C.wood, C.kraft, 0.3)} />
            <stop offset="100%" stopColor={mix(C.wood, C.black, 0.35)} />
          </linearGradient>
        </defs>

        <Camera scale={camScale} x={camX} y={-10}>
          {/* sky + stars behind the roof */}
          <rect width={1920} height={1080} fill="url(#s6sky)" />
          {new Array(22).fill(0).map((_, i) => {
            const r = rng(9100 + i);
            return <circle key={i} cx={r() * 1920} cy={40 + r() * 200} r={1.6 + r() * 2.6} fill={C.ice} opacity={0.25 + r() * 0.5} />;
          })}

          {/* roof: two slopes with crescent tiles */}
          <g>
            <Paper d={P([[HX - 30, CEIL + 10], [960, PEAK], [HX2 + 30, CEIL + 10]])} fill={mix(C.red3, C.wood, 0.45)} shadow="soft" tex={0.5} edge={light(mix(C.red3, C.wood, 0.45), 0.2)} />
            {new Array(15).fill(0).map((_, i) => {
              const t = (i + 0.5) / 15;
              const x = lerp(HX - 10, 960, t);
              const y = lerp(CEIL - 14, PEAK + 16, t);
              return <path key={`l${i}`} d={crescent(x, y + 10, 20, 0.35)} fill={mix(C.paper3, C.wood, 0.35)} opacity={0.55} transform={`rotate(-22 ${x} ${y})`} />;
            })}
            {new Array(15).fill(0).map((_, i) => {
              const t = (i + 0.5) / 15;
              const x = lerp(960, HX2 + 10, t);
              const y = lerp(PEAK + 16, CEIL - 14, t);
              return <path key={`r${i}`} d={crescent(x, y + 10, 20, 0.35)} fill={mix(C.paper3, C.wood, 0.35)} opacity={0.55} transform={`rotate(22 ${x} ${y})`} />;
            })}
            {/* chimney */}
            <Paper d={rrect(1280, 240, 90, 150, 6)} fill={mix(C.wood, C.black, 0.35)} shadow="near" tex={0.4} />
          </g>

          {/* the cut interior: one sheet of wall, three rooms */}
          <Paper d={P([[HX, CEIL], [HX2, CEIL], [HX2, FLOOR], [HX, FLOOR]])} fill="url(#s6room)" shadow="none" tex={0.55} />

          {/* floor */}
          <Paper d={tornRect({ x: HX - 6, y: FLOOR, w: HX2 - HX + 12, h: 90, top: 6, bottom: 0, left: 0, right: 0, step: 26, seed: 31 })} fill="url(#s6floor)" shadow="none" tex={0.5} />

          {/* interior partitions */}
          {[700, 1220].map((x, i) => (
            <g key={i}>
              <Paper d={P([[x - 7, CEIL], [x + 7, CEIL], [x + 7, 660], [x + 40, 660], [x + 40, FLOOR], [x, FLOOR], [x, 660], [x - 7, 660]])} fill={mix(C.paper3, C.kraft2, 0.34)} shadow="near" tex={0.4} />
            </g>
          ))}

          {/* ------------------------------------------------ bedroom */}
          <g>
            {/* window: day or night */}
            <Paper d={rrect(300, 500, 210, 200, 4)} fill={dn ? mix(C.ice, C.ink3, 0.35) : mix(C.ink1, C.ink2, 0.4)} shadow="near" tex={0.3} edge={light(C.paper3, 0.2)} />
            <rect x={300} y={500} width={210} height={200} fill={dn ? C.gold2 : C.ink2} opacity={dn ? 0.5 : 0.6} />
            <rect x={402} y={500} width={6} height={200} fill={mix(C.wood, C.black, 0.3)} opacity={0.7} />
            <rect x={300} y={594} width={210} height={6} fill={mix(C.wood, C.black, 0.3)} opacity={0.7} />
            {/* red reflection on the glass */}
            <rect x={300} y={500} width={210} height={200} fill={C.red} opacity={0.35 * redK * (1 - redOut)} style={{ mixBlendMode: 'screen' }} />

            {/* bed */}
            <g transform="translate(330 830)">
              <Paper d={rrect(0, -70, 300, 70, 8)} fill={mix(C.paper2, C.amber, 0.25)} shadow="mid" tex={0.45} edge={true} />
              <Paper d={rrect(0, -120, 26, 60, 8)} fill={mix(C.wood, C.paper3, 0.3)} shadow="near" tex={0.4} />
              <Paper d={rrect(30, -104, 96, 44, 12)} fill={C.paper} shadow="near" tex={0.4} />
              <Paper d={rrect(120, -96, 150, 30, 10)} fill={mix(C.red3, C.paper2, 0.55)} shadow="near" tex={0.4} />
            </g>
            {/* bedside table + lamp */}
            <g transform="translate(660 830)">
              <Paper d={rrect(-30, -70, 80, 70, 5)} fill={mix(C.wood, C.kraft, 0.25)} shadow="near" tex={0.4} />
              <Paper d={P([[-16, -76], [36, -76], [28, -118], [-8, -118]])} fill={mix(C.gold2, C.paper, 0.4)} shadow="near" tex={0.3} opacity={lamp(1)} />
              <Glow x={10} y={-100} r={150} fill="url(#glWarm)" opacity={0.3 * lamp(1)} />
            </g>
            {/* two photos on the wall */}
            {[0, 1].map((i) => (
              <g key={i} transform={`translate(${560 + i * 56} ${470 + i * 40}) rotate(${-6 + i * 9})`}>
                <Paper d={rrect(0, 0, 46, 56, 3)} fill={C.paper} shadow="near" tex={0.3} />
                <rect x={4} y={6} width={38} height={44} fill={mix(C.ink3, C.kraft2, 0.4)} />
              </g>
            ))}
          </g>

          {/* ------------------------------------------------ living room */}
          <g>
            {/* ceiling lamp */}
            <g transform="translate(960 420)">
              <Paper d={P([[-3, 0], [3, 0], [3, 90], [-3, 90]])} fill={mix(C.wood, C.black, 0.3)} shadow="none" tex={0.2} />
              <Paper d={P([[-52, 90], [52, 90], [34, 140], [-34, 140]])} fill={mix(C.gold2, C.paper, 0.35)} shadow="near" tex={0.3} opacity={lamp(1)} />
              <Glow x={0} y={130} r={260} fill="url(#glWarm)" opacity={0.34 * lamp(1)} />
            </g>

            {/* sofa */}
            <g transform="translate(760 840)">
              <Paper d={rrect(0, -80, 210, 80, 14)} fill={mix(C.red3, C.paper2, 0.35)} shadow="mid" tex={0.45} edge={true} />
              <Paper d={rrect(0, -140, 40, 70, 12)} fill={mix(C.red3, C.paper2, 0.28)} shadow="near" tex={0.45} />
              <Paper d={rrect(170, -140, 40, 70, 12)} fill={mix(C.red3, C.paper2, 0.28)} shadow="near" tex={0.45} />
            </g>

            {/* the table with two bowls */}
            <g transform="translate(1020 880)">
              <Paper d={P([[-150, -14], [150, -14], [150, 0], [-150, 0]])} fill={mix(C.wood, C.paper3, 0.3)} shadow="near" tex={0.4} />
              <rect x={-140} y={-14} width={280} height={12} fill={mix(C.wood, C.paper3, 0.15)} opacity={0.8} />
              <Paper d={P([[-120, 0], [-108, 0], [-112, 120], [-124, 120]])} fill={mix(C.wood, C.black, 0.3)} shadow="none" tex={0.2} />
              <Paper d={P([[108, 0], [120, 0], [124, 120], [112, 120]])} fill={mix(C.wood, C.black, 0.3)} shadow="none" tex={0.2} />
              <g transform="translate(-70 -14)">
                <Bowl w={88} fill={mix(C.paper, C.amber, 0.15)} amount={0.35} y={-8} shadow="near" />
                <Steam x={0} y={-46} t={g * 0.7} scale={0.5} count={2} opacity={0.28} />
              </g>
              <g transform="translate(70 -14)">
                {/* her bowl: empty, and the spoon she left in it */}
                <Bowl w={88} fill={mix(C.paper, C.amber, 0.1)} amount={0.04} y={-8} shadow="near" />
                <Chopstick len={120} fill={mix(C.wood, C.paper3, 0.4)} x={-60} y={-30} rot={-8} />
              </g>
            </g>

            {/* TV on the wall + the "家" cut-out */}
            <g transform="translate(1120 520)">
              <Paper d={rrect(-70, -46, 140, 92, 6)} fill="#161a20" shadow="near" tex={0.3} />
              <rect x={-62} y={-38} width={124} height={76} rx={3} fill={C.ice} opacity={0.12 + 0.1 * pulse(g, BEAT, 2)} />
            </g>
            <g transform={`translate(880 ${470 + fallK * 320}) rotate(${fallK * 34})`} opacity={1 - fallK * 0.3}>
              <Paper d={tornRect({ x: -52, y: -52, w: 104, h: 104, top: 3, bottom: 3, left: 3, right: 3, step: 14, seed: 121 })} fill={C.red} shadow="near" tex={0.3} />
              <PaperChar text="家" size={72} fill={mix(C.paper, C.red, 0.15)} />
            </g>
            {/* the clock, running backwards */}
            <g transform="translate(880 620)">
              <ClockFace r={52} face={C.paper} ink={mix(C.ink1, C.slate, 0.2)} hand={-(frame - at(152.66)) * 0.04} opacity={0.9} />
            </g>
          </g>

          {/* ------------------------------------------------ kitchen */}
          <g>
            {/* pendant light */}
            <g transform="translate(1460 420)">
              <Paper d={P([[-2, 0], [2, 0], [2, 60], [-2, 60]])} fill={mix(C.wood, C.black, 0.3)} shadow="none" tex={0.2} />
              <Paper d={P([[-36, 60], [36, 60], [24, 96], [-24, 96]])} fill={mix(C.gold2, C.paper, 0.4)} shadow="near" tex={0.3} opacity={lamp(1)} />
              <Glow x={0} y={92} r={200} fill="url(#glWarm)" opacity={0.36 * lamp(1)} />
            </g>

            {/* counter + stove */}
            <g transform="translate(1460 880)">
              <Paper d={rrect(-200, -130, 400, 130, 4)} fill={mix(C.paper3, C.wood, 0.42)} shadow="mid" tex={0.45} edge={true} />
              <Paper d={rrect(-200, -136, 400, 14, 4)} fill={mix(C.paper, C.kraft, 0.2)} shadow="near" tex={0.35} />
              {/* pot with steam */}
              <g transform="translate(-40 -140)">
                <Paper d={rrect(-52, -46, 104, 48, 8)} fill={mix(C.ice, C.ink2, 0.45)} shadow="near" tex={0.3} edge={true} />
                <Steam x={0} y={-50} t={g * 0.8} scale={0.7} count={3} opacity={0.34} />
              </g>
              {/* the bowl of congee, half full, and the bag with the other half */}
              <g transform="translate(110 -140)">
                <Bowl w={104} fill={mix(C.paper, C.amber, 0.12)} amount={lerp(0.85, 0.5, bowlK)} y={0} shadow="near" />
                <Steam x={0} y={-58} t={g * 0.9} scale={0.62} count={3} opacity={0.3 + 0.3 * bowlK} />
              </g>
              <g transform={`translate(${190 + (1 - bagK) * 90} ${-140 + (1 - bagK) * 60}) rotate(${-8 + (1 - bagK) * 20})`} opacity={clamp(bagK * 1.4)}>
                <Paper d={P([[-46, 0], [46, 0], [38, -74], [-38, -74]])} fill={mix(C.kraft, C.paper2, 0.35)} shadow="near" tex={0.4} edge={true} />
                <path d={P([[-30, -74], [30, -74], [26, -92], [-26, -92]])} fill={mix(C.paper2, C.kraft, 0.2)} opacity={0.9} />
              </g>
            </g>
          </g>

          {/* the crack that runs down the living-room wall */}
          {crackK > 0.01 ? (
            <g opacity={crackK}>
              {[62, 118, 175].map((a, i) => (
                <path key={i} d={crackPath(700, 420, 300 + i * 40, a, 18, 130 + i, 8)} stroke="#1a0f08" strokeWidth={5 - i} fill="none" strokeLinecap="round" opacity={0.75} strokeDasharray={620} strokeDashoffset={620 * (1 - crackK)} />
              ))}
              <g transform={`translate(660 ${500 + wallDrop}) rotate(6)`}>
                <Paper d={shard(66, 54, 151, 7)} fill={mix(C.paper3, C.kraft2, 0.3)} shadow="mid" tex={0.5} edge={true} />
              </g>
            </g>
          ) : null}

          {/* the foundation + the down payment */}
          <Paper d={tornRect({ x: HX - 20, y: FLOOR + 90, w: HX2 - HX + 40, h: 110, top: 4, bottom: 10, left: 6, right: 6, step: 30, seed: 201 })} fill={mix(C.kraft2, C.black, 0.45)} shadow="soft" tex={0.55} />
          <g transform={`translate(${HX2 - 250} ${FLOOR + 150}) rotate(-2)`}>
            <PaperChar text="首付？" size={54} fill={mix(C.paper, C.kraft, 0.3)} />
            <g opacity={clamp((frame - at(158.72)) / 10)}>
              <Paper
                d={P([[-70, 6], [90, -8], [94, 4], [-66, 18]])}
                fill={C.red}
                shadow="none"
                tex={0.4}
                transform={`rotate(-4)`}
              />
            </g>
          </g>

          {/* scattered scraps on the floorboards */}
          {new Array(8).fill(0).map((_, i) => {
            const r = rng(9300 + i);
            return <Scrap key={i} x={HX + 60 + r() * (HX2 - HX - 120)} y={FLOOR + 30 + r() * 40} size={8 + r() * 12} fill={mix(C.paper3, C.wood, 0.4)} seed={9400 + i} rot={r() * 360} opacity={0.55} />;
          })}

          {/* foreground: the table the diorama stands on, moving faster than the house */}
          <g transform={`translate(${camX * 0.9} 0)`}>
            <Paper
              d={tornRect({ x: -340, y: 1040, w: 2640, h: 280, top: 10, bottom: 0, left: 0, right: 0, step: 34, seed: 511 })}
              fill={mix(C.wood, C.black, 0.55)}
              shadow="deep"
              tex={0.6}
              edge={light(mix(C.wood, C.black, 0.55), 0.2)}
            />
            {/* scissors left on the table */}
            <g transform="translate(360 1058) rotate(-14)">
              <Paper d={P([[0, 0], [150, -16], [156, -4], [6, 12]])} fill={mix(C.ice, C.slate, 0.45)} shadow="near" tex={0.3} />
              <Paper d={P([[0, 0], [150, 16], [156, 4], [6, -12]])} fill={mix(C.ice, C.slate, 0.3)} shadow="near" tex={0.3} />
              <circle cx={-18} cy={-12} r={20} fill="none" stroke={mix(C.ice, C.slate, 0.4)} strokeWidth={7} />
              <circle cx={-18} cy={12} r={20} fill="none" stroke={mix(C.ice, C.slate, 0.4)} strokeWidth={7} />
            </g>
            {/* a stack of spare sheets */}
            <g transform="translate(1520 1104) rotate(4)">
              {[0, 1, 2].map((i) => (
                <g key={i} transform={`translate(${i * 8} ${-i * 10})`}>
                  <Paper
                    d={tornRect({ x: 0, y: 0, w: 300, h: 120, top: 4, bottom: 4, left: 4, right: 4, step: 26, seed: 520 + i })}
                    fill={[C.paper, C.paper2, C.paper3][i]}
                    shadow="near"
                    tex={0.5}
                    edge={true}
                  />
                </g>
              ))}
            </g>
            {/* scraps cut off the bottom of the sheet */}
            {new Array(7).fill(0).map((_, i) => {
              const r = rng(9600 + i);
              return <Scrap key={i} x={80 + r() * 1700} y={1030 + r() * 60} size={9 + r() * 14} fill={mix(C.paper3, C.wood, r())} seed={9700 + i} rot={r() * 360} opacity={0.7} />;
            })}
          </g>

          <Vignette opacity={0.9} />
          <GrainOverlay opacity={0.17} dust={0.22} />
        </Camera>

        <Wash color={mix(C.ink1, C.black, 0.35)} opacity={0.18 + 0.22 * outK} blend="multiply" />
        <Wash color={C.black} opacity={ramp(frame, at(188.2), at(188.8), 0, 0.55)} blend="normal" />
      </Svg>
    </AbsoluteFill>
  );
};
