import React from 'react';
import { SceneElement } from '@/types/scene';
import { FormGroup, SegmentedControl } from '@/components/ui';

export interface LandingFxControlProps {
  element: SceneElement;
  updateElement: (id: string, patch: Partial<SceneElement>) => void;
  label?: string;
  tooltip?: string;
}

export const LandingFxControl: React.FC<LandingFxControlProps> = ({
  element,
  updateElement,
  label = 'Hiệu ứng chạm đích',
  tooltip = 'Tạo nhịp nhấn thị giác (phình nhẹ hoặc phát sáng) ngay khi số hoặc biểu đồ đếm tới giá trị đích',
}) => {
  const currentFx = element.landingFx || 'none';

  const options = [
    { value: 'none', label: 'Tắt' },
    { value: 'pulse', label: 'Nhấn nhẹ' },
    { value: 'glow', label: 'Phát sáng' },
  ];

  return (
    <FormGroup label={label} tooltip={tooltip}>
      <SegmentedControl
        options={options}
        value={currentFx}
        onChange={(val) => updateElement(element.id, { landingFx: val as 'none' | 'pulse' | 'glow' })}
        size="xs"
        fullWidth
      />
    </FormGroup>
  );
};
