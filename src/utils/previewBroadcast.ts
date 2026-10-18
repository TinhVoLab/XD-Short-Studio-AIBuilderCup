// BroadcastChannel singleton for syncing preview state across windows
export const PREVIEW_CHANNEL = "xd-short-preview"

export interface PreviewMessage {
  type: "state" | "play" | "pause" | "seek" | "close"
  scenes?: any[]
  bgMusicUrl?: string
  bgMusicVolume?: number
  audioClips?: any[]
  frame?: number
}

let _channel: BroadcastChannel | null = null

export function getPreviewChannel(): BroadcastChannel {
  if (!_channel) _channel = new BroadcastChannel(PREVIEW_CHANNEL)
  return _channel
}

export function closePreviewChannel() {
  _channel?.close()
  _channel = null
}
