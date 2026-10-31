// S5 · 52–60 s · 沙滩 · 第九封信 (S08 S16 X05)
// The rain that froze has become the grain of the sand. Nine sheets unfold in a row and the word
// comes out of the paper, one letter per letter. The O arrives last, out of the button.
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Canvas, EASE, mix, prog, rand} from '../lib/motion';
import {Letter, OLetter, Sea, Sheet} from '../lib/film';
import {COLOR, COPY, T} from '../spec';

const W = 154, HC = 62, HO = 230, TOP = 460, BASE = 615;
const GAPS = [10, 10, 56, 56, 10, 10, 10, 56]; // wider breaks after JAY, I and E
const XS = (() => {
  const out = [158];
  for (let i = 1; i < 9; i++) out.push(out[i - 1] + W + GAPS[i - 1]);
  return out;
})();

export const S5Beach: React.FC<{t: number}> = ({t}) => {
  if (t < T.beachIn) return null;
  const fade = prog(t, T.fade0, 2.6, EASE.smooth); // S16 the last three seconds
  const sea = prog(t, 52.0, 1.2, EASE.smooth);
  const grain = prog(t, 52.3, 1.1, EASE.out);

  return (
    <AbsoluteFill>
      <Canvas>
        {/* E14 the sea, far side of the beach */}
        <Sea o={sea * (1 - fade)} />
        {/* E12b finer grain, joining the frozen rain lines */}
        <g opacity={grain * (1 - fade)}>
          {Array.from({length: 170}, (_, i) => {
            const x = rand(`sx-${i}`) * 1960 - 20;
            const y = 336 + rand(`sy-${i}`) * 732;
            const len = 22 + rand(`sl-${i}`) * 58;
            return <line key={i} x1={x} y1={y} x2={x + len} y2={y} stroke={COLOR.beachSand} strokeWidth={1.3} opacity={0.5} />;
          })}
        </g>

        {/* E13 nine letter sheets, unfolded in order, 0.3 s apart */}
        {Array.from({length: 9}, (_, i) => {
          const x = XS[i];
          const dy = (rand(`dy-${i}`) - 0.5) * 20;
          const tilt = (rand(`tl-${i}`) - 0.5) * 4.2;
          const p = prog(t, T.sheet0 + i * T.sheetStep, 0.9, EASE.smooth);
          const clipH = mix(HC, HO, p);
          return (
            <g key={i}>
              <Sheet x={x} y={TOP} w={W} hc={HC} ho={HO} p={p} tilt={tilt} dy={dy} shadow={(1 - fade) * prog(t, 52.45, 0.5, EASE.out)} />
              {i === 5 ? (
                <g key="o">
                  <defs>
                    <clipPath id={`ocut-${i}`}>
                      <rect x={x - 2} y={TOP + dy} width={W + 4} height={clipH} />
                    </clipPath>
                  </defs>
                  <g clipPath={`url(#ocut-${i})`}>
                    <OLetter x={x + W / 2} y={BASE - 40 + dy} p={prog(t, T.oMorph, 1.0, EASE.smooth)} />
                  </g>
                </g>
              ) : (
                <Letter
                  ch={COPY.line.replace(/ /g, '')[i]}
                  x={x}
                  top={TOP}
                  w={W}
                  clipH={clipH}
                  rot={(rand(`rt-${i}`) - 0.5) * 3.6}
                  dy={dy}
                  base={BASE}
                  id={`lt-${i}`}
                />
              )}
            </g>
          );
        })}
      </Canvas>
    </AbsoluteFill>
  );
};
