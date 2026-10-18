import React from 'react';
import szStyles from './SafeZone.module.css';

interface SafeZoneOverlayProps {
  platform: 'none' | 'tiktok' | 'shorts' | 'reels';
}

export const SafeZoneOverlay: React.FC<SafeZoneOverlayProps> = ({ platform }) => {
  if (platform === 'none') return null;

  return (
    <div className={szStyles.overlayLegacy}>
      {/* KHUNG VIỀN ĐỨT BÁO HIỆU SAFE ZONE */}
      <div className={szStyles.safeBoxLegacy}>
        <span className={szStyles.safeLabelLegacy}>SAFE ZONE</span>
      </div>

      {/* TIKTOK / REELS UI MOCKUP OVERLAY */}
      <div style={{ position: 'absolute', inset: 0 }}>

        {/* TOP BAR (Following / For You) */}
        <div className={szStyles.topBarLegacy}>
          <div className={`${szStyles.topBarLegacyAvatar} ${szStyles.topBarLegacyAvatarLeft}`} />
          <span className={szStyles.topBarLegacyFollowing}>Đang Follow</span>
          <span className={szStyles.topBarLegacyForYou}>Dành cho bạn</span>
          <div className={`${szStyles.topBarLegacyAvatar} ${szStyles.topBarLegacyAvatarRight}`} />
        </div>

        {/* RIGHT INTERACTION COLUMN */}
        <div className={szStyles.rightColLegacy}>
          {/* Avatar */}
          <div className={szStyles.legacyAvatarCircle}>
            <div className={szStyles.legacyAvatarPlus}>
              <span className={szStyles.legacyAvatarPlusText}>+</span>
            </div>
          </div>
          {/* Like */}
          <div className={szStyles.legacyActionBtnMt}>
            <div className={szStyles.legacyActionIcon} />
            <span className={szStyles.legacyActionCount}>124K</span>
          </div>
          {/* Comment */}
          <div className={szStyles.legacyActionBtn}>
            <div className={szStyles.legacyActionIcon} />
            <span className={szStyles.legacyActionCount}>456</span>
          </div>
          {/* Bookmark */}
          <div className={szStyles.legacyActionBtn}>
            <div className={szStyles.legacyActionIcon} />
            <span className={szStyles.legacyActionCount}>12K</span>
          </div>
          {/* Share */}
          <div className={szStyles.legacyActionBtn}>
            <div className={szStyles.legacyActionIcon} />
            <span className={szStyles.legacyActionCount}>789</span>
          </div>
        </div>

        {/* BOTTOM AREA (Caption & Music) */}
        <div className={szStyles.bottomAreaLegacy}>
          <span className={szStyles.legacyAccountName}>@motion_studio</span>

          <div className={szStyles.legacyCaption}>
            <div className={szStyles.legacyCaptionLine} />
            <div className={szStyles.legacyCaptionLineShort} />
          </div>

          <div className={szStyles.legacyAudioRow}>
            <div className={szStyles.legacyAudioIcon} />
            <div className={szStyles.legacyAudioBar} />
          </div>
        </div>

        {/* Music Disk */}
        <div className={szStyles.musicDiskLegacy}>
          <div className={szStyles.musicDiskLegacyCenter} />
        </div>

        {/* Fake Seekbar */}
        <div className={szStyles.seekbarLegacy}>
          <div className={szStyles.seekbarFillLegacy} />
        </div>

      </div>
    </div>
  );
};
