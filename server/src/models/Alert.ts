import mongoose, { Schema, Document } from 'mongoose';

export interface IAlert extends Document {
  brandId: mongoose.Types.ObjectId;
  type: 'sentiment_spike' | 'volume_anomaly' | 'influencer_mention' | 'crisis' | 'competitor_attack';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  triggerMentions: mongoose.Types.ObjectId[];
  metrics: {
    sentimentChange: number;
    volumeChange: number;
    affectedMentions: number;
    timeWindow: string;
  };
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledgedBy?: mongoose.Types.ObjectId;
  resolvedBy?: mongoose.Types.ObjectId;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  createdAt: Date;
}

const AlertSchema = new Schema<IAlert>(
  {
    brandId: {
      type: Schema.Types.ObjectId,
      ref: 'Brand',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['sentiment_spike', 'volume_anomaly', 'influencer_mention', 'crisis', 'competitor_attack'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: String,
    triggerMentions: [{
      type: Schema.Types.ObjectId,
      ref: 'Mention',
    }],
    metrics: {
      sentimentChange: Number,
      volumeChange: Number,
      affectedMentions: Number,
      timeWindow: String,
    },
    status: {
      type: String,
      enum: ['active', 'acknowledged', 'resolved'],
      default: 'active',
      index: true,
    },
    acknowledgedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    acknowledgedAt: Date,
    resolvedAt: Date,
  },
  {
    timestamps: true,
  }
);

AlertSchema.index({ brandId: 1, status: 1, createdAt: -1 });

export const Alert = mongoose.model<IAlert>('Alert', AlertSchema);
