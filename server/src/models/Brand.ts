import mongoose, { Schema, Document } from 'mongoose';

export interface IBrand extends Document {
  name: string;
  keywords: string[];
  hashtags: string[];
  handles: {
    twitter?: string;
    instagram?: string;
    tiktok?: string;
    reddit?: string;
  };
  competitors: mongoose.Types.ObjectId[];
  industry: string;
  settings: {
    alertThreshold: number;
    monitoringEnabled: boolean;
    platforms: string[];
  };
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BrandSchema = new Schema<IBrand>(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },
    keywords: [String],
    hashtags: [String],
    handles: {
      twitter: String,
      instagram: String,
      tiktok: String,
      reddit: String,
    },
    competitors: [{
      type: Schema.Types.ObjectId,
      ref: 'Brand',
    }],
    industry: String,
    settings: {
      alertThreshold: { type: Number, default: 20 }, // Percentage change to trigger alert
      monitoringEnabled: { type: Boolean, default: true },
      platforms: {
        type: [String],
        default: ['twitter', 'reddit', 'news'],
      },
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Brand = mongoose.model<IBrand>('Brand', BrandSchema);
