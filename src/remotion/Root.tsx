import React from 'react';
import { Composition } from 'remotion';
import { MainComposition, MainCompositionProps } from './MainComposition';
import { DEFAULT_SCENES, TOTAL_DURATION } from '@/utils/scenes';
import { getTotalRemotionDurationFrames } from '@/utils/sceneTiming';

import { HookComposition, DEFAULT_HOOK_PROPS } from './compositions/HookComposition';
import './fonts/fontCatalog';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MotionStudio"
        component={MainComposition as any}
        calculateMetadata={({ props }: { props: any }) => {
          const fps = 30;
          const audiosDur = (props.audioClips || []).reduce((max: number, a: any) => {
            const end = (a.startSec || 0) + (a.playDurationSec || 0);
            return Math.max(max, end);
          }, 0);
          
          return {
            durationInFrames: getTotalRemotionDurationFrames(props.scenes || DEFAULT_SCENES, audiosDur, fps),
          };
        }}
        fps={30}
        width={360}
        height={640}
        defaultProps={{
          scenes: DEFAULT_SCENES,
          audioClips: [],
          durationInFrames: TOTAL_DURATION * 30,
        }}
      />
      <Composition
        id="HookComposition"
        component={HookComposition}
        calculateMetadata={({ props }) => {
          const durSec = (props as any)?.sceneConfig?.duration || 4;
          return {
            durationInFrames: Math.round(durSec * 30),
          };
        }}
        fps={30}
        width={360}
        height={640}
        defaultProps={DEFAULT_HOOK_PROPS}
      />
    </>
  );
};
