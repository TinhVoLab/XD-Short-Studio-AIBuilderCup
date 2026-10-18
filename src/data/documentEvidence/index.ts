import { DocumentEvidencePresetItem } from './types'
import { HIGHLIGHTER_DOC_PRESETS } from './highlighterDocs'
import { RUBBER_STAMP_PRESETS } from './rubberStamps'
import { STICKY_NOTE_PRESETS } from './stickyNotes'

export * from './types'
export * from './highlighterDocs'
export * from './rubberStamps'
export * from './stickyNotes'

export const ALL_DOCUMENT_EVIDENCE_PRESETS: DocumentEvidencePresetItem[] = [
  ...HIGHLIGHTER_DOC_PRESETS,
  ...RUBBER_STAMP_PRESETS,
  ...STICKY_NOTE_PRESETS,
]
