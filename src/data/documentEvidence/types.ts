import { DocumentEvidenceVariant, DocumentEvidenceData } from '@/types/scene'

export interface DocumentEvidencePresetItem {
  id: string;
  variant: DocumentEvidenceVariant;
  category: 'highlighter' | 'stamp' | 'note';
  label: string;
  previewBadge: string;
  data: DocumentEvidenceData;
  animPreset: string;
}
