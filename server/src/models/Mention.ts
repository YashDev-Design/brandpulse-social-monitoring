import mongoose, { Schema, Document } from 'mongoose';

export interface IMention extends Document {
  platform: 'twitter' | 'reddit' | 'tiktok' | 'instagram' | 'news';
  brandId: mongoose.Types.ObjectId;
  content: string;
  author: {
    id: string;
    username: string;
    displayName: string;
    followers: number;
    verified: boolean;
    profileUrl: string;
    avatarUrl?: string;
  };
  sentiment: {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
    confidence: number;
    emotions: string[];
    intent: 'complaint' | 'praise' | 'question' | 'other';
  };
  engagement: {
    likes: number;
    shares: number;
    comments: number;
    reach: number;
  };
  topics: string[];
  hashtags: string[];
  urls: string[];
  mediaUrls: string[];
  location?: string;
  language: string;
  isInfluencer: boolean;
  influencerScore: number;
  sourceUrl: string;
  postedAt: Date;
  processedAt: Date;
  createdAt: Date;
}

const MentionSchema = new Schema<IMention>(
  {
    platform: {
      type: String,
      enum: ['twitter', 'reddit', 'tiktok', 'instagram', 'news'],
      required: true,
      index: true,
    },
    brandId: {
      type: Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    author: {
      id: String,
      username: String,
      displayName: String,
      followers: { type: Number, default: 0 },
      verified: { type: Boolean, default: false },
      profileUrl: String,
      avatarUrl: String,
    },
    sentiment: {
      score: { type: Number, min: -1, max: 1, default: 0 },
      label: {
        type: String,
        enum: ['positive', 'negative', 'neutral'],
        default: 'neutral',
      },
      confidence: { type: Number, min: 0, max: 1, default: 0 },
      emotions: [String],
      intent: {
        type: String,
        enum: ['complaint', 'praise', 'question', 'other'],
        default: 'other',
      },
    },
    engagement: {
      likes: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      reach: { type: Number, default: 0 },
    },
    topics: [String],
    hashtags: [String],
    urls: [String],
    mediaUrls: [String],
    location: String,
    language: { type: String, default: 'en' },
    isInfluencer: { type: Boolean, default: false },
    influencerScore: { type: Number, default: 0 },
    sourceUrl: String,
    postedAt: { type: Date, required: true, index: true },
    processedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
MentionSchema.index({ brandId: 1, postedAt: -1 });
MentionSchema.index({ brandId: 1, 'sentiment.label': 1 });
MentionSchema.index({ brandId: 1, platform: 1, postedAt: -1 });

export const Mention = mongoose.model<IMention>('Mention', MentionSchema);
