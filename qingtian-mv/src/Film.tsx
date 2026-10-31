// Film.tsx — the master timeline. Layers read ABSOLUTE time t from useTime(); no <Sequence> remounts,
// so objects that persist across scenes never jump. Each scene decides its own visibility from t.
import React from 'react';
import {AbsoluteFill, Audio, staticFile} from 'remotion';
import {useTime, Grain, prog, EASE} from './lib/motion';
import {LineField, mixHex} from './lib/film';
import {COLOR, FILM} from './spec';
import {S1Spring} from './scenes/S1Spring';
import {S2Summer} from './scenes/S2Summer';
import {S3Autumn} from './scenes/S3Autumn';
import {S4Winter} from './scenes/S4Winter';
import {S5Beach} from './scenes/S5Beach';

// The ground colour is one continuous value for the whole film, so a season change is a change of
// light, never a crossfade. Autumn gives way to winter on a hard cut at 42 s, as the prompt asks.
const groundColor = (t: number) => {
  if (t < 11.0) return COLOR.springBg;
  if (t < 12.4) return mixHex(COLOR.springBg, COLOR.summerBg, prog(t, 11.0, 1.4, EASE.smooth));
  if (t < 26.9) return COLOR.summerBg;
  if (t < 28.3) return mixHex(COLOR.summerBg, COLOR.autumnSky, prog(t, 26.9, 1.4, EASE.smooth));
  if (t < 42) return COLOR.autumnSky;
  if (t < 51.0) return COLOR.winterBg;
  if (t < 52.6) return mixHex(COLOR.winterBg, COLOR.beachBg, prog(t, 51.0, 1.6, EASE.smooth));
  return COLOR.beachBg;
};

export const Film: React.FC = () => {
  const {t} = useTime();
  return (
    <AbsoluteFill style={{backgroundColor: groundColor(t)}}>
      <S1Spring t={t} />
      <S2Summer t={t} />
      <S3Autumn t={t} />
      <S4Winter t={t} />
      {/* E12 one field of lines: rain through the winter, the grain of the sand afterwards */}
      <LineField t={t} />
      <S5Beach t={t} />
      <Grain opacity={0.075} freq={0.85} blend="multiply" />
      {FILM.sound && <Audio src={staticFile('score.wav')} />}
    </AbsoluteFill>
  );
};
