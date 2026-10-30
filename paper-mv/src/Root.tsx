import React from 'react';
import { Composition } from 'remotion';
import { PaperMV, SfxOnly } from './PaperMV';
import { DURATION_IN_FRAMES, FPS, H, W } from './theme';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="PaperMV"
      component={PaperMV}
      durationInFrames={DURATION_IN_FRAMES}
      fps={FPS}
      width={W}
      height={H}
    />
    <Composition
      id="SfxOnly"
      component={SfxOnly}
      durationInFrames={DURATION_IN_FRAMES}
      fps={FPS}
      width={W}
      height={H}
    />
  </>
);
