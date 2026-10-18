/**
 * Global Branding & Super Metadata Settings Schema (Versioned & Extensible)
 */

export type SeoNamingPattern = 
  | 'slug-by-author-year'   // [tieu-de]-by-[tac-gia]-[nam].mp4
  | 'slug-by-author'        // [tieu-de]-by-[tac-gia].mp4
  | 'slug-year'             // [tieu-de]-[nam].mp4
  | 'slug-only';            // [tieu-de].mp4

export interface BrandingSettings {
  schemaVersion: number;
  
  // 1. Author & Brand Identity (Brand Kit)
  authorName: string;
  authorHandle: string;
  authorAvatarUrl: string;
  authorAvatarSize: number;
  brandColor: string;            // Màu thương hiệu chủ đạo (ví dụ: #BEFF01)
  defaultFont: string;           // Font chữ mặc định (ví dụ: Be Vietnam Pro)
  
  // 2. MP4 Super Metadata (QuickTime Atoms / Dublin Core)
  defaultGenre: string;
  copyrightTemplate: string;
  websiteUrl: string;
  encoderTag: string;
  autoEmbedSuperMetadata: boolean;
  
  // 3. SEO Filename Rules
  seoNamingPattern: SeoNamingPattern;
  autoUppercaseSlug: boolean;

  // 4. Social & Hashtags (Distribution)
  brandHashtags: string;
  defaultNicheHashtags: string;
  defaultCta: string;
  captionTone: 'viral' | 'professional' | 'educational' | 'storytelling';
}

export const DEFAULT_BRANDING_SETTINGS: BrandingSettings = {
  schemaVersion: 2,
  authorName: 'TinhVo Digital',
  authorHandle: '@tinhvodigital',
  authorAvatarUrl: '',
  authorAvatarSize: 44,
  brandColor: '#BEFF01',
  defaultFont: 'Be Vietnam Pro',
  defaultGenre: 'Công nghệ & AI / Short-form Video',
  copyrightTemplate: '© {YEAR} {AUTHOR}. All rights reserved.',
  websiteUrl: 'https://tinhvo.digital',
  encoderTag: 'XD-Short Studio Pro v2.0',
  autoEmbedSuperMetadata: true,
  seoNamingPattern: 'slug-by-author-year',
  autoUppercaseSlug: false,
  brandHashtags: '#TinhVoDigital #XDShort',
  defaultNicheHashtags: '#congnghe #ai #kienthuc #shorts #reels',
  defaultCta: '👉 Đăng ký kênh để nhận thêm mẹo hay mỗi ngày!',
  captionTone: 'viral',
};
