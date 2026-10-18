import React from 'react'
import { Player } from '@remotion/player'
import { MainComposition } from '@/remotion/MainComposition'
import type { Scene } from '@/types/scene'

const FPS = 30

/**
 * Xem trước một cảnh bằng chính engine dựng video (MainComposition), không âm thanh, lặp lại.
 * Cảnh của wizard đã đủ element (hydrate Master / engine thường) nên hình giống video xuất ra.
 */
export function ScenePreviewPlayer({ scene }: { scene: Scene }) {
  const durationInFrames = Math.max(FPS, Math.round((scene.duration || 3) * FPS))
  // Một cảnh đứng riêng: bỏ chuyển cảnh để không mờ dần ở đầu/cuối vòng lặp
  const inputProps = React.useMemo(
    () => ({ scenes: [{ ...scene, transition: undefined }], audioClips: [], isMuted: true, showWatermark: false }),
    [scene]
  )

  return (
    <Player
      key={scene.id}
      component={MainComposition as React.ComponentType<any>}
      inputProps={inputProps}
      durationInFrames={durationInFrames}
      compositionWidth={360}
      compositionHeight={640}
      fps={FPS}
      autoPlay
      loop
      initiallyMuted
      clickToPlay={false}
      style={{ width: '100%', height: '100%' }}
    />
  )
}
