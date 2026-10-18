import React from 'react'
import styles from './AudioVuMeter.module.css'

interface AudioVuMeterProps {
  isPlaying: boolean
  isMuted: boolean
}

export function AudioVuMeter({ isPlaying, isMuted }: AudioVuMeterProps) {
  const active = isPlaying && !isMuted

  return (
    <div 
      className={`${styles.vuContainer} ${active ? styles.playing : ''} ${isMuted ? styles.muted : ''}`}
      title={isMuted ? "Âm thanh đang tắt (Mute)" : active ? "VU Meter: Đang phát tín hiệu âm thanh Stereo (L/R)" : "VU Meter: Chờ phát"}
    >
      {/* 4-Bar Equalizer Waveform */}
      <div className={styles.equalizer} aria-hidden>
        <div className={styles.eqBar} />
        <div className={styles.eqBar} />
        <div className={styles.eqBar} />
        <div className={styles.eqBar} />
      </div>

      {/* Dual Channel Stereo VU Heatmap (L/R) */}
      <div className={styles.stereoChannels} aria-hidden>
        <div className={styles.channelRow}>
          <span className={styles.channelLabel}>L</span>
          <div className={styles.meterTrack}>
            <div className={`${styles.meterFill} ${styles.meterFillL}`} />
          </div>
        </div>
        <div className={styles.channelRow}>
          <span className={styles.channelLabel}>R</span>
          <div className={styles.meterTrack}>
            <div className={`${styles.meterFill} ${styles.meterFillR}`} />
          </div>
        </div>
      </div>
    </div>
  )
}
