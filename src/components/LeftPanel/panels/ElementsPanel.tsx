import React, { useState } from 'react'
import styles from './Panels.module.css'
import epStyles from './ElementsPanel.module.css'
import { useEditorStore } from '@/store/useEditorStore'
import { useShallow } from 'zustand/react/shallow'
import { ALL_SOCIAL_CALLOUT_PRESETS, SocialCalloutPresetItem } from '@/data/socialCallouts'
import { ALL_DOCUMENT_EVIDENCE_PRESETS, DocumentEvidencePresetItem } from '@/data/documentEvidence'
import { HOOK_CALLOUT_PRESETS, FRAME_MOCKUP_PRESETS } from '@/data/hookElements'
import { FRAME_CATEGORIES } from '@/config/frameCatalog'
import { Button, SegmentedControl } from '@/components/ui'

type MainTab = 'social' | 'frame' | 'doc'

const ALL_COMBINED_SOCIAL_PRESETS: any[] = [
  ...HOOK_CALLOUT_PRESETS,
  ...ALL_SOCIAL_CALLOUT_PRESETS,
]

export default function ElementsPanel() {
  const [mainTab, setMainTab] = useState<MainTab>('social')
  const [frameCategory, setFrameCategory] = useState<string>('all')

  const { addElement, showToast } = useEditorStore(
    useShallow(s => ({
      addElement: s.addElement,
      showToast: s.showToast,
    }))
  )

  const handleAddSocialOrHook = (item: any) => {
    if (item.type === 'fake-search') {
      const s = item.searchData;
      addElement({
        type: 'fake-search',
        left: 180,
        top: 200,
        width: 310,
        height: 54,
        scaleX: 1,
        scaleY: 1,
        angle: 0,
        opacity: 1,
        accentColor: s?.accentColor || item.accentColor || '#00D4FF',
        animPreset: (item.animPreset as any) || 'none',
        animDuration: 1.5,
        content: s?.keyword || item.label,
        searchData: s,
      })
      showToast(`Đã thêm: ${item.label}`)
      return
    }

    if (item.type === 'push-notification') {
      const n = item.notificationData;
      addElement({
        type: 'push-notification',
        left: 180,
        top: 140,
        width: 320,
        height: 85,
        scaleX: 1,
        scaleY: 1,
        angle: 0,
        opacity: 1,
        accentColor: n?.accentColor || item.accentColor || '#00D46A',
        animPreset: (item.animPreset as any) || 'slide-up',
        animDuration: 0.6,
        animDelay: 0.2,
        content: n?.title || item.label,
        subtitle: n?.appName,
        notificationData: n,
      })
      showToast(`Đã thêm: ${item.label}`)
      return
    }

    const p = item as SocialCalloutPresetItem;
    addElement({
      type: 'social-callout',
      left: 180,
      top: 280,
      width: 320,
      height: 140,
      scaleX: 1,
      scaleY: 1,
      angle: 0,
      opacity: 1,
      accentColor: p.data?.accentColor || '#00D46A',
      animPreset: p.animPreset as any,
      animDuration: 0.6,
      animDelay: 0.05,
      content: p.data?.title,
      calloutData: p.data,
    })
    showToast(`Đã thêm: ${p.label}`)
  }

  const handleAddFrame = (item: any) => {
    const f = item.frameData;
    addElement({
      type: 'frame-mockup',
      left: 180,
      top: 200,
      width: f?.framePreset === 'iphone-dynamic-island' ? 200 : 330,
      height: f?.framePreset === 'iphone-dynamic-island' ? 380 : 220,
      scaleX: 1,
      scaleY: 1,
      angle: 0,
      opacity: 1,
      accentColor: f?.accentColor || item.accentColor || '#00D4FF',
      animPreset: (item.animPreset as any) || 'fade-in',
      animDuration: 0.5,
      content: f?.urlText || item.label,
      frameData: f,
    })
    showToast(`Đã thêm: ${item.label}`)
  }

  const handleAddDoc = (p: DocumentEvidencePresetItem) => {
    addElement({
      type: 'document-evidence',
      left: 180,
      top: 280,
      width: 320,
      height: 140,
      scaleX: 1,
      scaleY: 1,
      angle: 0,
      opacity: 1,
      accentColor: p.data.accentColor || '#FFE600',
      animPreset: p.animPreset as any,
      animDuration: 0.6,
      animDelay: 0.05,
      content: p.data.title,
      docData: p.data,
    })
    showToast(`Đã thêm: ${p.label}`)
  }

  const filteredSocial = ALL_COMBINED_SOCIAL_PRESETS

  const filteredFrames = FRAME_MOCKUP_PRESETS.filter(item => {
    if (frameCategory === 'all') return true
    return item.frameData?.framePreset?.includes(frameCategory)
  })

  const filteredDoc = ALL_DOCUMENT_EVIDENCE_PRESETS

  return (
    <div className={styles.svgPanelContainer}>
      {/* Top Sub-tab Switcher */}
      <div className={epStyles.tabSwitcher}>
        <SegmentedControl
          options={[
            { value: 'social', label: 'Mạng xã hội' },
            { value: 'frame', label: 'Khung viền' },
            { value: 'doc', label: 'Tài liệu' }
          ]}
          value={mainTab}
          onChange={(val) => setMainTab(val as any)}
          size="xs"
          fullWidth
        />
      </div>

      {/* ── TAB 1: SOCIAL & HOOK CALLOUTS ── */}
      {mainTab === 'social' && (
        <div className={epStyles.cardList}>
          {filteredSocial.map(item => {
            const itemAccent = (item as any).data?.accentColor || item.accentColor || '#00D46A';
            return (
              <div
                key={item.id}
                onClick={() => handleAddSocialOrHook(item)}
                className={epStyles.elementCard}
              >
                <div className={epStyles.cardHeader}>
                  <span className={epStyles.cardTitle}>
                    {item.label}
                  </span>
                </div>

                <div className={epStyles.canvasWrapper}>
                  {item.type === 'fake-search' && (
                    <div
                      className={epStyles.searchBarBox}
                      style={{ border: `1px solid ${itemAccent}55` }}
                    >
                      <span className={epStyles.searchIcon}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="11" cy="11" r="8" />
                          <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                      </span>
                      <span className={epStyles.searchKeyword}>
                        {(item as any).searchData?.keyword}
                      </span>
                      <div
                        className={epStyles.searchEnterBadge}
                        style={{ background: `${itemAccent}25`, color: itemAccent }}
                      >
                        ↵
                      </div>
                    </div>
                  )}

                  {item.type === 'push-notification' && (
                    <div
                      className={epStyles.pushNotifBox}
                      style={{ border: `1px solid ${itemAccent}44` }}
                    >
                      <div className={epStyles.pushNotifHeader}>
                        <div className={epStyles.pushNotifApp}>
                          <span className={epStyles.pushNotifAppIcon}>{(item as any).notificationData?.appIcon || '🔔'}</span>
                          <span className={epStyles.pushNotifAppName}>{(item as any).notificationData?.appName}</span>
                        </div>
                        <span className={epStyles.pushNotifTime}>{(item as any).notificationData?.timeText}</span>
                      </div>
                      <div
                        className={epStyles.pushNotifTitle}
                        style={{ color: itemAccent }}
                      >
                        {(item as any).notificationData?.title}
                      </div>
                      <div className={epStyles.pushNotifMsg}>
                        {(item as any).notificationData?.message}
                      </div>
                    </div>
                  )}

                  {(item as any).variant === 'bank' && (
                    <div className={epStyles.bankBox}>
                      <div className={epStyles.bankHeader}>
                        <div className={epStyles.bankSubtitleBox}>
                          <span
                            className={epStyles.bankIcon}
                            style={{
                              background: `linear-gradient(135deg, ${(item as any).data.accentColor || '#00D46A'} 0%, #0052FF 100%)`
                            }}
                          >
                            🏛️
                          </span>
                          <span className={epStyles.bankSubtitle}>{(item as any).data.subtitle || 'NGÂN HÀNG'}</span>
                        </div>
                        <span
                          className={epStyles.bankBadge}
                          style={{
                            color: (item as any).data.accentColor || '#00D46A',
                            background: `${(item as any).data.accentColor || '#00D46A'}18`,
                            border: `1px solid ${(item as any).data.accentColor || '#00D46A'}33`,
                          }}
                        >
                          {(item as any).data.badge || 'THÀNH CÔNG'}
                        </span>
                      </div>
                      <div
                        className={epStyles.bankTitle}
                        style={{
                          color: (item as any).data.accentColor || '#00D46A',
                          textShadow: `0 0 10px ${(item as any).data.accentColor || '#00D46A'}66`,
                        }}
                      >
                        {(item as any).data.title}
                      </div>
                      {(item as any).data.content && (
                        <div className={epStyles.bankContent}>
                          ND: {(item as any).data.content}
                        </div>
                      )}
                    </div>
                  )}

                  {item.variant === 'tweet' && (
                    <div className={epStyles.tweetBox}>
                      <div className={epStyles.tweetHeader}>
                        <div className={epStyles.tweetUser}>
                          <div
                            className={epStyles.tweetAvatar}
                            style={{
                              background: `linear-gradient(135deg, ${item.data.accentColor || '#1DA1F2'} 0%, #0D8BD9 100%)`
                            }}
                          >
                            👤
                          </div>
                          <span className={epStyles.tweetName}>{item.data.title}</span>
                          <span
                            className={epStyles.tweetCheck}
                            style={{ color: item.data.accentColor || '#1DA1F2' }}
                          >
                            ☑️
                          </span>
                          <span className={epStyles.tweetHandle}>{item.data.subtitle}</span>
                        </div>
                        <span className={epStyles.tweetLogo}>𝕏</span>
                      </div>
                      <div className={epStyles.tweetContent}>
                        {item.data.content}
                      </div>
                      <div className={epStyles.tweetMetrics}>
                        <span>❤️ 142K</span>
                        <span>🔁 28.4K</span>
                        <span>👁️ 1.2M</span>
                      </div>
                    </div>
                  )}

                  {item.variant === 'chat' && (
                    <div className={epStyles.chatBox}>
                      <div className={epStyles.chatHeader}>
                        <span className={epStyles.chatDot} />
                        <span className={epStyles.chatTitle}>{item.data.title}</span>
                        <span className={epStyles.chatSubtitle}>{item.data.subtitle}</span>
                      </div>
                      <div
                        className={epStyles.chatBubble}
                        style={{
                          background: item.data.accentColor
                            ? `linear-gradient(135deg, ${item.data.accentColor} 0%, ${item.data.accentColor}CC 100%)`
                            : 'linear-gradient(135deg, #007AFF 0%, #0056B3 100%)',
                        }}
                      >
                        {item.data.content}
                      </div>
                    </div>
                  )}

                  {item.variant === 'news' && (
                    <div
                      className={epStyles.newsBox}
                      style={{ border: `1px solid ${item.data.accentColor || '#FF3B30'}` }}
                    >
                      <div
                        className={epStyles.newsHeader}
                        style={{ background: item.data.accentColor || '#FF3B30' }}
                      >
                        <span className={epStyles.newsBadge}>🔴 {item.data.badge || 'BREAKING NEWS'}</span>
                        <span className={epStyles.newsLiveTag}>{item.data.subtitle || 'LIVE 24H'}</span>
                      </div>
                      <div className={epStyles.newsContent}>
                        {item.data.content || item.data.title}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── TAB 2: KHUNG & MOCKUP ── */}
      {mainTab === 'frame' && (
        <div className={epStyles.cardList}>
          {filteredFrames.map(item => {
            const itemAccent = item.accentColor || '#00D4FF';
            const f = item.frameData;
            return (
              <div
                key={item.id}
                onClick={() => handleAddFrame(item)}
                className={epStyles.elementCard}
              >
                <div className={epStyles.cardHeader}>
                  <span className={epStyles.cardTitle}>
                    {item.label}
                  </span>
                  <span
                    className={epStyles.previewBadge}
                    style={{
                      color: itemAccent,
                      background: `${itemAccent}18`,
                      border: `1px solid ${itemAccent}33`,
                    }}
                  >
                    {item.previewBadge}
                  </span>
                </div>

                <div className={epStyles.canvasWrapper}>
                  <div
                    className={epStyles.frameBox}
                    style={{ border: `1.5px solid ${itemAccent}66` }}
                  >
                    <div className={epStyles.frameHeader}>
                      <span className={epStyles.dotRed} />
                      <span className={epStyles.dotYellow} />
                      <span className={epStyles.dotGreen} />
                      <span className={epStyles.frameUrl}>
                        {f?.urlText || (f?.framePreset === 'iphone-dynamic-island' ? 'iPhone 15 Notch' : 'motionstudio.ai')}
                      </span>
                    </div>
                    <div className={epStyles.frameBody}>
                      [ Khung Phủ Lên Video ]
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── TAB 3: DOCUMENT & HIGHLIGHTER ── */}
      {mainTab === 'doc' && (
        <div className={epStyles.docList}>
          {filteredDoc.map(item => {
            const p = item as DocumentEvidencePresetItem
            const accent = p.data.accentColor || '#BEFF01'
            const subtitleText = p.data.highlight ? `Trích: "${p.data.highlight}"` : (p.data.subtitle || p.data.content || '')

            return (
              <div
                key={p.id}
                onClick={() => handleAddDoc(p)}
                className={epStyles.docCard}
              >
                <div className={epStyles.docHeader}>
                  <span className={epStyles.docTitle}>
                    {p.label}
                  </span>
                  <span
                    className={epStyles.docBadge}
                    style={{
                      color: accent,
                      background: `${accent}15`,
                      border: `1px solid ${accent}30`,
                    }}
                  >
                    {p.previewBadge}
                  </span>
                </div>

                {subtitleText && (
                  <div className={epStyles.docSubtitle}>
                    {subtitleText}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
