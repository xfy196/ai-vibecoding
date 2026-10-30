import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import { CUES, SfxName } from './cues';
import { Lyrics } from './Lyrics';
import { DURATION_IN_FRAMES, SHOTS } from './theme';
import { Shot01 } from './shots/Shot01';
import { Shot02 } from './shots/Shot02';
import { Shot03 } from './shots/Shot03';
import { Shot04 } from './shots/Shot04';
import { Shot05 } from './shots/Shot05';
import { Shot06 } from './shots/Shot06';
import { Shot07 } from './shots/Shot07';
import { Shot08 } from './shots/Shot08';
import { Shot09 } from './shots/Shot09';

export const SHOT_COMPONENTS = [Shot01, Shot02, Shot03, Shot04, Shot05, Shot06, Shot07, Shot08, Shot09];

const Sfx: React.FC<{ at: number; sfx: SfxName; vol: number }> = ({ at, sfx, vol }) => (
  <Sequence from={at} durationInFrames={Math.max(1, DURATION_IN_FRAMES - at)} layout="none">
    <Audio src={staticFile(`sfx/${sfx}.wav`)} volume={vol} />
  </Sequence>
);

export const NianShaoMV: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: '#000' }}>
    {SHOTS.map((shot, i) => {
      const Comp = SHOT_COMPONENTS[i];
      return (
        <Sequence key={shot.index} from={shot.from} durationInFrames={shot.dur} name={`${shot.index}. ${shot.name}`}>
          <Comp t0={shot.from} />
        </Sequence>
      );
    })}

    {/* 歌词：剪纸字形贴在撕边纸影上，时间轴取自 .lrc */}
    <Lyrics />

    {/* the song itself — the film is cut to it, not the other way round */}
    <Audio src={staticFile('music/song.mp3')} volume={1} />

    {CUES.map((c, i) => (
      <Sfx key={i} at={c.at} sfx={c.sfx} vol={c.vol} />
    ))}
  </AbsoluteFill>
);

/** QA composition: sound effects only, to check cue placement without the song. */
export const SfxOnly: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: '#101418' }}>
    {CUES.map((c, i) => (
      <Sfx key={i} at={c.at} sfx={c.sfx} vol={c.vol} />
    ))}
  </AbsoluteFill>
);
