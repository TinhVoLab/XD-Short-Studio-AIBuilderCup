import React, { useState } from 'react';
import styles from './Panels.module.css';
import apStyles from './AudioPanel.module.css';
import { SegmentedControl } from '@/components/ui';
import { VoiceSection } from './audio/VoiceSection';
import { BgmSection } from './audio/BgmSection';
import { AudioUploadZone } from './audio/AudioUploadZone';
import { WaveformSection } from './audio/WaveformSection';
import SfxSection from './SfxSection';

export default function AudioPanel() {
  const [activeSubTab, setActiveSubTab] = useState<'voice' | 'bgm' | 'sfx' | 'waveform'>('bgm');

  return (
    <div className={styles.svgPanelContainer}>
      {/* Top Sub-tab Switcher */}
      <div className={apStyles.subTabMb}>
        <SegmentedControl
          options={[
            { value: 'voice', label: 'Giọng đọc' },
            { value: 'bgm', label: 'Nhạc nền' },
            { value: 'sfx', label: 'Hiệu ứng' },
            { value: 'waveform', label: 'Sóng âm' },
          ]}
          value={activeSubTab}
          onChange={(val) => setActiveSubTab(val as 'voice' | 'bgm' | 'sfx' | 'waveform')}
          size="sm"
          fullWidth
        />
      </div>

      {/* ── TAB 1: GIỌNG ĐỌC AI (A1) ── */}
      {activeSubTab === 'voice' && <VoiceSection />}

      {/* ── TAB 2: NHẠC NỀN BGM (A3) ── */}
      {activeSubTab === 'bgm' && (
        <>
          <BgmSection />
          <AudioUploadZone />
        </>
      )}

      {/* ── TAB 3: SOUND FX (A2) ── */}
      {activeSubTab === 'sfx' && <SfxSection />}

      {/* ── TAB 4: SÓNG ÂM THANH (WAVEFORM) ── */}
      {activeSubTab === 'waveform' && <WaveformSection />}
    </div>
  );
}
