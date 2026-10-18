import React from "react";
import szStyles from "./SafeZone.module.css";

export type SafePlatform = "tiktok" | "youtube-shorts" | "instagram-reels" | "facebook-reels";

interface TikTokSafeZoneOverlayProps {
  platform?: SafePlatform;
}

export const TikTokSafeZoneOverlay: React.FC<TikTokSafeZoneOverlayProps> = ({ platform = "tiktok" }) => {
  // Dynamic values per platform (kept inline — JS-computed)
  const safeBoxRight = platform === "youtube-shorts" ? 56 : (platform === "tiktok" ? 52 : 48);
  const safeBoxBottom = platform === "tiktok" ? 145 : (platform === "youtube-shorts" ? 120 : 130);
  const sidebarBottom = platform === "tiktok" ? 130 : 100;

  return (
    <div className={szStyles.overlay}>
      {/* ── SAFE ZONE OUTLINE BOX ── */}
      <div
        className={szStyles.safeBox}
        style={{ right: safeBoxRight, bottom: safeBoxBottom }}
      >
        <div className={szStyles.safeLabel}>
          ✦ Safe Zone ({platform.replace("-", " ")})
        </div>
      </div>

      {/* ── TOP HEADER BAR ── */}
      <div className={szStyles.topBar}>
        <div className={szStyles.topBarLeft}>
          <span className={szStyles.topBarLiveText}>Live</span>
        </div>

        {/* Platform-specific Header Tabs */}
        <div className={szStyles.topBarCenter}>
          {platform === "tiktok" && (
            <>
              <span className={szStyles.tabInactive}>Bạn bè</span>
              <span className={szStyles.tabActive}>Dành cho bạn</span>
            </>
          )}
          {platform === "youtube-shorts" && (
            <span className={szStyles.tabShorts}>Shorts</span>
          )}
          {platform === "instagram-reels" && (
            <span className={szStyles.tabReelsIg}>Reels</span>
          )}
          {platform === "facebook-reels" && (
            <span className={szStyles.tabReelsFb}>Reels</span>
          )}
        </div>

        <div className={szStyles.topBarRight}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
      </div>

      {/* ── RIGHT ACTION BUTTONS ── */}
      <div className={szStyles.rightSidebar} style={{ bottom: sidebarBottom }}>
        {/* Avatar with Plus Badge */}
        <div className={szStyles.avatarWrap}>
          <div className={szStyles.avatarCircle}>👤</div>
          <div className={szStyles.avatarPlusBadge}>+</div>
        </div>

        {/* Like */}
        <div className={szStyles.actionBtn}>
          <div className={szStyles.actionIcon}>❤️</div>
          <span className={szStyles.actionCount}>128.4K</span>
        </div>

        {/* Comment */}
        <div className={szStyles.actionBtn}>
          <div className={szStyles.actionIconSm}>💬</div>
          <span className={szStyles.actionCount}>1.2K</span>
        </div>

        {/* Bookmark */}
        <div className={szStyles.actionBtn}>
          <div className={szStyles.actionIconSm}>🔖</div>
          <span className={szStyles.actionCount}>15.6K</span>
        </div>

        {/* Share */}
        <div className={szStyles.actionBtn}>
          <div className={szStyles.actionIconSm}>➤</div>
          <span className={szStyles.actionCount}>Share</span>
        </div>

        {/* Rotating Sound Disk */}
        {platform !== "youtube-shorts" && (
          <div className={szStyles.musicDisk}>
            <span className={szStyles.musicDiskIcon}>🎵</span>
          </div>
        )}
      </div>

      {/* ── BOTTOM CAPTION & AUDIO OVERLAY ── */}
      <div className={szStyles.bottomBar}>
        {/* Account Name */}
        <div className={szStyles.accountRow}>
          <span className={szStyles.accountName}>@motionstudio.ai</span>
          <span className={szStyles.followBadge}>Follow</span>
        </div>

        {/* Video Caption & Hashtags */}
        <div className={szStyles.captionText}>
          Tự động tạo video ngắn chuyên nghiệp chuẩn Mobile 9:16 với AI 🚀 #shorts #viral #ai
        </div>

        {/* Audio Track line */}
        <div className={szStyles.audioLine}>
          <span className={szStyles.audioLineIcon}>🎶</span>
          <span className={szStyles.audioLineText}>Âm thanh gốc - Motion Studio Audio</span>
        </div>

        {/* Mock Seekbar */}
        <div className={szStyles.seekbar}>
          <div className={szStyles.seekbarFill} />
        </div>
      </div>
    </div>
  );
};
