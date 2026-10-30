import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import { BEAT, SHOTS, DURATION_IN_FRAMES } from './theme';
import { Shot01 } from './shots/Shot01';
import { Shot02 } from './shots/Shot02';
import { Shot03 } from './shots/Shot03';
import { Shot04 } from './shots/Shot04';
import { Shot05 } from './shots/Shot05';
import { Shot06 } from './shots/Shot06';
import { Shot07 } from './shots/Shot07';
import { Shot08 } from './shots/Shot08';
import { Shot09 } from './shots/Shot09';

type SfxName =
  | 'paper_swish'
  | 'paper_big'
  | 'wave_rise'
  | 'splash'
  | 'lantern_ping'
  | 'bubble_pop'
  | 'paper_tear'
  | 'whale'
  | 'whoosh_push'
  | 'chime_gold'
  | 'tick'
  | 'paper_fall'
  | 'heartbeat'
  | 'crowd'
  | 'boom'
  | 'glow';

export interface Cue {
  at: number;
  sfx: SfxName;
  volume: number;
}

/** Every sound effect is generated in assets/gen_audio.py and placed on the frame grid. */
export const CUES: Cue[] = [
  // ① 启航 — a paper layer per beat, the boat breaks the surface on beat seven
  ...[0, 1, 2, 3, 4, 5].map((i) => ({ at: i * BEAT, sfx: 'paper_swish' as SfxName, volume: 0.34 })),
  { at: 5 * BEAT + 12, sfx: 'paper_big', volume: 0.4 },
  { at: 5 * BEAT + 18, sfx: 'splash', volume: 0.46 },

  // ② 孤夜 — pull back, lantern ticking on the beat, stars on the half beat
  { at: 6 * BEAT, sfx: 'heartbeat', volume: 0.42 },
  { at: 6 * BEAT, sfx: 'paper_big', volume: 0.3 },
  ...[6, 7, 8, 9].map((b) => ({ at: b * BEAT, sfx: 'lantern_ping' as SfxName, volume: 0.22 })),
  ...[6.5, 7.5, 8.5].map((b) => ({ at: b * BEAT, sfx: 'tick' as SfxName, volume: 0.1 })),

  // ③ 想着你 — the bubble grows
  { at: 9.5 * BEAT, sfx: 'glow', volume: 0.3 },
  { at: 10 * BEAT, sfx: 'bubble_pop', volume: 0.34 },
  { at: 11 * BEAT, sfx: 'bubble_pop', volume: 0.3 },

  // ④ 不惶恐 — the biggest hit in the film
  { at: 222, sfx: 'boom', volume: 0.55 },
  { at: 222, sfx: 'wave_rise', volume: 0.4 },
  { at: 13.5 * BEAT, sfx: 'glow', volume: 0.28 },
  { at: 14 * BEAT, sfx: 'whale', volume: 0.46 },
  { at: 14.5 * BEAT, sfx: 'splash', volume: 0.34 },
  { at: 15.5 * BEAT, sfx: 'whale', volume: 0.3 },

  // ⑤ 人来人往 — the crowd shuffles, a batch per beat
  ...[17.5, 18.5, 19.5, 20.5, 21.5].map((b) => ({ at: b * BEAT, sfx: 'crowd' as SfxName, volume: 0.22 })),
  ...[17.5, 18.5, 19.5, 20.5, 21.5, 22.5].map((b) => ({
    at: b * BEAT,
    sfx: 'paper_swish' as SfxName,
    volume: 0.16,
  })),

  // ⑥ 离开 — the sheets tear apart on the downbeat
  { at: 23 * BEAT, sfx: 'paper_tear', volume: 0.5 },
  { at: 23 * BEAT, sfx: 'boom', volume: 0.34 },
  { at: 23 * BEAT, sfx: 'whoosh_push', volume: 0.26 },

  // ⑦ 感谢 — a lantern every half beat
  { at: 519, sfx: 'chime_gold', volume: 0.36 },
  ...[0, 1, 2, 3, 4, 5, 6, 7, 8].map((k) => ({
    at: 519 + k * (BEAT / 2),
    sfx: 'lantern_ping' as SfxName,
    volume: 0.13,
  })),

  // ⑧ 你眼中 — push on the downbeat
  { at: 33.67 * BEAT, sfx: 'whoosh_push', volume: 0.4 },
  { at: 33.67 * BEAT, sfx: 'glow', volume: 0.26 },
  { at: 35.2 * BEAT, sfx: 'tick', volume: 0.12 },

  // ⑨ 尾声 — the seas fall away, one per beat
  ...[0, 1, 2].map((i) => ({ at: 37.34 * BEAT + i * BEAT, sfx: 'paper_fall' as SfxName, volume: 0.32 })),
  { at: 37.34 * BEAT + BEAT, sfx: 'paper_big', volume: 0.3 },
  { at: 39.2 * BEAT, sfx: 'lantern_ping', volume: 0.24 },
];

export const Sfx: React.FC<{ ctx: Cue }> = ({ ctx }) => (
  <Sequence from={Math.round(ctx.at)} durationInFrames={90} layout="none">
    <Audio src={staticFile(`sfx/${ctx.sfx}.wav`)} volume={ctx.volume} />
  </Sequence>
);

const SHOT_COMPONENTS = [Shot01, Shot02, Shot03, Shot04, Shot05, Shot06, Shot07, Shot08, Shot09];

export const PaperMV: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: '#000' }}>
    {SHOTS.map((shot, i) => {
      const Comp = SHOT_COMPONENTS[i];
      return (
        <Sequence key={shot.index} from={shot.from} durationInFrames={shot.dur} name={`${shot.index}`}>
          <Comp t0={shot.from} />
        </Sequence>
      );
    })}

    {/*
      Soundtrack slot. The original mp4's audio track is undecodable beyond ~10 s,
      so this 100 BPM bed was synthesised to match the cut sheet exactly.
      To use a real song instead: drop a 24.1 s file at public/music/bed.mp3
      (or swap the src below) and re-render — no other change needed.
    */}
    <Audio src={staticFile('music/bed.mp3')} volume={0.78} />

    {CUES.filter((c) => c.at < DURATION_IN_FRAMES).map((c, i) => (
      <Sfx key={i} ctx={c} />
    ))}
  </AbsoluteFill>
);

/**
 * QA-only composition: the sound effects on their own, no music bed. Used to
 * verify frame-accurate cue placement without the bed masking everything.
 */
export const SfxOnly: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: '#101820' }}>
    {CUES.filter((c) => c.at < DURATION_IN_FRAMES).map((c, i) => (
      <Sfx key={i} ctx={c} />
    ))}
  </AbsoluteFill>
);
