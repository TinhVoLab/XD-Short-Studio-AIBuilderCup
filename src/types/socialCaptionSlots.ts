export interface SocialCaptionEnvelope {
  schemaVersion: '2.0';
  targetNiche: string;
  payload: {
    youtube: {
      titleViral: string;
      titleSeo: string;
      description: string;
    };
    tiktok: {
      title: string;
      caption: string;
    };
    pinnedComment: {
      question: string;
      callout: string;
    };
    curatedHashtags: string[];
  };
  metrics?: {
    hookStrength: 'high' | 'medium';
    antiAiCompliance: boolean;
  };
}
