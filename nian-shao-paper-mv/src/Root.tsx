import React from 'react';
import { Composition } from 'remotion';
import { NianShaoMV, SfxOnly } from './NianShaoMV';
import { DURATION_IN_FRAMES, FPS, H, W } from './theme';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="NianShaoMV" component={NianShaoMV} durationInFrames={DURATION_IN_FRAMES} fps={FPS} width={W} height={H} />
    <Composition id="SfxOnly" component={SfxOnly} durationInFrames={DURATION_IN_FRAMES} fps={FPS} width={W} height={H} />
  </>
);
