import React, { useState, useEffect } from 'react';
import { API_BASE } from '@/config/api';
import { useSettingsStore } from '@/store/useSettingsStore';
import { Button } from '@/components/ui';
import { SocialCaptionEnvelope } from '@/types/socialCaptionSlots';

// Kiểu dữ liệu sử dụng Payload TypeSafe JEV chuẩn
export type CaptionData = SocialCaptionEnvelope['payload'];

interface SocialCaptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenes: any[];
  brandingSettings: any;
  onSaveCaptions?: (captions: CaptionData) => void;
  initialCaptions?: any; // Bất kỳ định dạng cũ nào cũng sẽ được convert
}

export function SocialCaptionModal({
  isOpen,
  onClose,
  scenes,
  brandingSettings,
  onSaveCaptions,
  initialCaptions
}: SocialCaptionModalProps) {
  const [loading, setLoading] = useState(false);
  const [captions, setCaptions] = useState<CaptionData | null>(null);
  const [language, setLanguage] = useState<'vi' | 'en'>('vi');
  const [niche, setNiche] = useState('Tech & AI');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'youtube' | 'tiktok'>('youtube');

  // Xử lý backward compatibility từ Dữ liệu cũ -> Cấu trúc TypeSafe mới
  useEffect(() => {
    if (initialCaptions) {
      if (typeof initialCaptions.youtube === 'string') {
        setCaptions({
          youtube: { titleViral: '', titleSeo: '', description: initialCaptions.youtube },
          tiktok: { title: '', caption: initialCaptions.tiktok || '' },
          pinnedComment: { question: initialCaptions.pinnedComment || '', callout: '' },
          curatedHashtags: []
        });
      } else {
        setCaptions(initialCaptions);
      }
    }
  }, [initialCaptions]);

  if (!isOpen) return null;

  const extractFullScript = () => {
    return scenes.map((s: any, idx: number) => {
      const vo = s.voiceoverText?.trim();
      const elementTexts = (s.elements || []).map((el: any) => {
        if (el.type === 'master-hook' && el.masterHookData?.heroTitle) {
          return `${el.masterHookData.badgeText || ''} ${el.masterHookData.heroTitle}`.trim();
        }
        if (el.type === 'caption' && el.content) return el.content.trim();
        return el.content || el.textContent || '';
      }).filter(Boolean).join(', ');

      const parts: string[] = [];
      if (vo) parts.push(`Lời đọc: "${vo}"`);
      if (elementTexts) parts.push(`Chữ: [${elementTexts}]`);
      if (!vo && !elementTexts && s.name) parts.push(`Chủ đề: ${s.name}`);
      return parts.length > 0 ? `Cảnh ${idx + 1}: ${parts.join(' - ')}` : '';
    }).filter(Boolean).join('\n');
  };

  const generateCaptions = async () => {
    try {
      setLoading(true);
      const script = extractFullScript();
      
      const storeApiKey = useSettingsStore.getState().geminiApiKey;
      const localApiKey = localStorage.getItem('xd_short_gemini_api_key');
      const apiKey = storeApiKey || localApiKey || '';

      const res = await fetch(`${API_BASE}/api/ai/social-caption`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
        },
        body: JSON.stringify({ script: script || 'Video ngắn sáng tạo nội dung.', brandingSettings, language, niche, apiKey })
      });
      
      if (!res.ok) throw new Error('API Error');
      const data: SocialCaptionEnvelope = await res.json();
      
      setCaptions(data.payload);
      if (onSaveCaptions) onSaveCaptions(data.payload);
    } catch (e) {
      console.error(e);
      const scriptText = extractFullScript();
      const fallback: CaptionData = {
        youtube: {
          titleViral: scriptText.slice(0, 60),
          titleSeo: scriptText.slice(0, 60),
          description: scriptText.slice(0, 150)
        },
        tiktok: { title: scriptText.slice(0, 40), caption: scriptText.slice(0, 100) },
        pinnedComment: { question: 'Bạn nghĩ sao về điều này?', callout: 'Hãy để lại bình luận!' },
        curatedHashtags: ['#Shorts']
      };
      setCaptions(fallback);
      if (onSaveCaptions) onSaveCaptions(fallback);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const renderCopyButton = (id: string, text: string, label = 'Sao chép') => (
    <button
      onClick={() => copyToClipboard(id, text)}
      style={{
        background: copiedKey === id ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
        color: copiedKey === id ? '#000' : '#fff',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 6,
        padding: '4px 10px',
        fontSize: 11,
        fontWeight: 600,
        cursor: 'pointer',
        whiteSpace: 'nowrap'
      }}
    >
      {copiedKey === id ? 'Đã chép' : label}
    </button>
  );

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 650, padding: 16
    }}>
      <div style={{
        background: '#18181b', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: 16,
        width: 680, maxWidth: '96vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85)', overflow: 'hidden', animation: 'fadeIn 0.2s ease-out'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, background: 'rgba(190, 255, 1, 0.12)',
              color: '#BEFF01', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
            }}>📱</div>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: '#fff' }}>Social Caption Engine 2.0</h3>
              <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.45)', marginTop: 1 }}>
                TypeSafe AI JEV • Chuẩn SEO • Anti-AI Text
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <select value={language} onChange={e => setLanguage(e.target.value as any)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', borderRadius: 6, fontSize: 11, padding: '5px 8px', outline: 'none' }}>
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
            <select value={niche} onChange={e => setNiche(e.target.value)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', borderRadius: 6, fontSize: 11, padding: '5px 8px', outline: 'none' }}>
              <option value="Tech & AI">Công nghệ & AI</option>
              <option value="Finance & Crypto">Tài chính</option>
              <option value="Health & Lifestyle">Sức khỏe</option>
              <option value="Education">Giáo dục</option>
              <option value="Entertainment">Giải trí</option>
            </select>
            <Button asIcon variant="ghost" size="icon-xs" onClick={onClose} title="Đóng">✕</Button>
          </div>
        </div>

        {/* Body Content */}
        <div style={{ padding: '18px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {!captions ? (
            <div style={{ textAlign: 'center', padding: '36px 20px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px dashed rgba(255, 255, 255, 0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color: 'var(--accent)' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </div>
              <h4 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px 0', color: '#fff' }}>Tạo Kịch Bản Đăng TypeSafe 2.0</h4>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: '0 auto 18px', maxWidth: 420 }}>
                Trích xuất tiêu đề Viral, tiêu đề SEO và Mô tả chuẩn con người viết (Anti-AI).
              </p>
              <Button variant="primary" size="md" loading={loading} disabled={loading} onClick={generateCaptions} leftIcon="✨">
                {loading ? 'Đang phân tích...' : 'Bắt Đầu Tạo'}
              </Button>
            </div>
          ) : (
            <>
              {/* Custom Tabs */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                <button
                  onClick={() => setActiveTab('youtube')}
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: activeTab === 'youtube' ? 'rgba(255, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    color: activeTab === 'youtube' ? '#ff5555' : 'rgba(255, 255, 255, 0.6)',
                    fontWeight: activeTab === 'youtube' ? 700 : 500,
                    transition: 'all 0.2s'
                  }}
                >
                  YouTube Shorts
                </button>
                <button
                  onClick={() => setActiveTab('tiktok')}
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: activeTab === 'tiktok' ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    color: activeTab === 'tiktok' ? '#00f2fe' : 'rgba(255, 255, 255, 0.6)',
                    fontWeight: activeTab === 'tiktok' ? 700 : 500,
                    transition: 'all 0.2s'
                  }}
                >
                  TikTok & Reels
                </button>
              </div>

              {activeTab === 'youtube' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* YouTube Title Viral */}
                  <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Tiêu đề Viral (Khơi gợi tò mò)</span>
                      {renderCopyButton('yt-viral', captions.youtube.titleViral)}
                    </div>
                    <div style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{captions.youtube.titleViral}</div>
                  </div>
                  
                  {/* YouTube Title SEO */}
                  <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Tiêu đề SEO (Top tìm kiếm)</span>
                      {renderCopyButton('yt-seo', captions.youtube.titleSeo)}
                    </div>
                    <div style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{captions.youtube.titleSeo}</div>
                  </div>

                  {/* YouTube Description */}
                  <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Mô tả (Chuẩn PAS + Hashtags)</span>
                      {renderCopyButton('yt-desc', `${captions.youtube.description}\n\n${captions.curatedHashtags.join(' ')}`)}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                      {captions.youtube.description}
                      <br /><br />
                      <span style={{ color: 'var(--accent)' }}>{captions.curatedHashtags.join(' ')}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'tiktok' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* TikTok Title */}
                  <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Tiêu đề ngắn</span>
                      {renderCopyButton('tk-title', captions.tiktok.title)}
                    </div>
                    <div style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{captions.tiktok.title}</div>
                  </div>

                  {/* TikTok Caption */}
                  <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Caption (Storytelling)</span>
                      {renderCopyButton('tk-cap', `${captions.tiktok.caption}\n\n${captions.curatedHashtags.join(' ')}`)}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                      {captions.tiktok.caption}
                      <br /><br />
                      <span style={{ color: 'var(--accent)' }}>{captions.curatedHashtags.join(' ')}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Pinned Comment Box - Always visible */}
              <div style={{
                background: 'rgba(190, 255, 1, 0.04)', border: '1px solid rgba(190, 255, 1, 0.2)',
                borderRadius: 12, padding: '12px 14px', marginTop: 4
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>📌 Bình luận ghim kích tương tác</span>
                  {renderCopyButton('pinned', `${captions.pinnedComment.question} ${captions.pinnedComment.callout}`)}
                </div>
                <div style={{ fontSize: 13, color: '#fff' }}>
                  {captions.pinnedComment.question} <br />
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{captions.pinnedComment.callout}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(255, 255, 255, 0.02)'
        }}>
          {captions ? (
            <Button variant="secondary" size="sm" loading={loading} disabled={loading} onClick={generateCaptions} leftIcon="🔄">
              Viết Lại Phiên Bản Khác
            </Button>
          ) : <div />}
          <Button variant="primary" size="sm" onClick={onClose}>Đóng</Button>
        </div>
      </div>
    </div>
  );
}
