import { SceneElement } from '@/types/scene'
import { useSettingsStore } from '@/store/useSettingsStore'
import { useEditorStore } from '@/store/useEditorStore'
import { resolveMascotPoseUrl } from '@/types/character'

export function getMascotSlotUrl(el: SceneElement): string {
  const settings = useSettingsStore.getState()
  const editor = useEditorStore.getState()
  const profileId = el.profileId || editor.activeMascotProfileId || settings.activeMascotProfileId || 'doodle-boy'
  const profile = settings.mascotProfiles[profileId] || settings.mascotProfiles['doodle-boy']
  const pose = el.pose || 'idea'
  return resolveMascotPoseUrl(profile, pose)
}
