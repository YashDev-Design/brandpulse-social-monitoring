import { Router } from 'express';
import { Mention } from '../models/Mention';
import { Alert } from '../models/Alert';

const router = Router();

// Get dashboard metrics
router.get('/dashboard', async (req, res) => {
  try {
    const { brandId, period = '7d' } = req.query;

    // Calculate date range
    const now = new Date();
    const periodDays = parseInt(period as string) || 7;
    const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const previousStartDate = new Date(startDate.getTime() - periodDays * 24 * 60 * 60 * 1000);

    const match: any = { postedAt: { $gte: startDate } };
    const previousMatch: any = { postedAt: { $gte: previousStartDate, $lt: startDate } };
    if (brandId) {
      match.brandId = brandId;
      previousMatch.brandId = brandId;
    }

    // Current period metrics
    const [currentStats, previousStats, sentimentTrend, platformBreakdown, alerts] = await Promise.all([
      Mention.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalMentions: { $sum: 1 },
            avgSentiment: { $avg: '$sentiment.score' },
            totalReach: { $sum: '$engagement.reach' },
            positiveMentions: {
              $sum: { $cond: [{ $eq: ['$sentiment.label', 'positive'] }, 1, 0] },
            },
            negativeMentions: {
              $sum: { $cond: [{ $eq: ['$sentiment.label', 'negative'] }, 1, 0] },
            },
          },
        },
      ]),
      Mention.aggregate([
        { $match: previousMatch },
        {
          $group: {
            _id: null,
            totalMentions: { $sum: 1 },
            avgSentiment: { $avg: '$sentiment.score' },
          },
        },
      ]),
      Mention.aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$postedAt' } },
            },
            avgSentiment: { $avg: '$sentiment.score' },
            count: { $sum: 1 },
            positive: {
              $sum: { $cond: [{ $eq: ['$sentiment.label', 'positive'] }, 1, 0] },
            },
            negative: {
              $sum: { $cond: [{ $eq: ['$sentiment.label', 'negative'] }, 1, 0] },
            },
            neutral: {
              $sum: { $cond: [{ $eq: ['$sentiment.label', 'neutral'] }, 1, 0] },
            },
          },
        },
        { $sort: { '_id.date': 1 } },
      ]),
      Mention.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$platform',
            count: { $sum: 1 },
            avgSentiment: { $avg: '$sentiment.score' },
          },
        },
      ]),
      Alert.find({ brandId, status: 'active' }).sort({ createdAt: -1 }).limit(5),
    ]);

    const current = currentStats[0] || { totalMentions: 0, avgSentiment: 0, totalReach: 0, positiveMentions: 0, negativeMentions: 0 };
    const previous = previousStats[0] || { totalMentions: 0, avgSentiment: 0 };

    // Calculate changes
    const mentionChange = previous.totalMentions
      ? Math.round(((current.totalMentions - previous.totalMentions) / previous.totalMentions) * 100)
      : 0;
    const sentimentChange = previous.avgSentiment
      ? Math.round(((current.avgSentiment - previous.avgSentiment) / Math.abs(previous.avgSentiment || 1)) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        summary: {
          totalMentions: current.totalMentions,
          mentionChange,
          avgSentiment: Math.round(current.avgSentiment * 100) / 100,
          sentimentChange,
          totalReach: current.totalReach,
          positiveMentions: current.positiveMentions,
          negativeMentions: current.negativeMentions,
          positiveRate: current.totalMentions
            ? Math.round((current.positiveMentions / current.totalMentions) * 100)
            : 0,
        },
        sentimentTrend: sentimentTrend.map(t => ({
          date: t._id.date,
          avgSentiment: Math.round(t.avgSentiment * 100) / 100,
          count: t.count,
          positive: t.positive,
          negative: t.negative,
          neutral: t.neutral,
        })),
        platformBreakdown: platformBreakdown.map(p => ({
          platform: p._id,
          count: p.count,
          avgSentiment: Math.round(p.avgSentiment * 100) / 100,
        })),
        activeAlerts: alerts,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard metrics' });
  }
});

// Get trending topics
router.get('/topics', async (req, res) => {
  try {
    const { brandId, limit = 20 } = req.query;

    const match: any = {
      postedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    };
    if (brandId) match.brandId = brandId;

    const topics = await Mention.aggregate([
      { $match: match },
      { $unwind: '$topics' },
      {
        $group: {
          _id: '$topics',
          count: { $sum: 1 },
          avgSentiment: { $avg: '$sentiment.score' },
        },
      },
      { $sort: { count: -1 } },
      { $limit: Number(limit) },
    ]);

    res.json({
      success: true,
      data: topics.map(t => ({
        topic: t._id,
        count: t.count,
        sentiment: Math.round(t.avgSentiment * 100) / 100,
      })),
    });
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch topics' });
  }
});

// Get hashtag trends
router.get('/hashtags', async (req, res) => {
  try {
    const { brandId, limit = 30 } = req.query;

    const match: any = {
      postedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    };
    if (brandId) match.brandId = brandId;

    const hashtags = await Mention.aggregate([
      { $match: match },
      { $unwind: '$hashtags' },
      {
        $group: {
          _id: '$hashtags',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: Number(limit) },
    ]);

    res.json({
      success: true,
      data: hashtags.map(h => ({
        hashtag: h._id,
        count: h.count,
      })),
    });
  } catch (error) {
    console.error('Error fetching hashtags:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch hashtags' });
  }
});

// Get competitor comparison
router.get('/competitors', async (req, res) => {
  try {
    const { brandIds } = req.query;

    if (!brandIds) {
      return res.status(400).json({ success: false, error: 'brandIds required' });
    }

    const ids = (brandIds as string).split(',');
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const comparison = await Mention.aggregate([
      {
        $match: {
          brandId: { $in: ids },
          postedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: '$brandId',
          totalMentions: { $sum: 1 },
          avgSentiment: { $avg: '$sentiment.score' },
          totalReach: { $sum: '$engagement.reach' },
          positivePct: {
            $avg: { $cond: [{ $eq: ['$sentiment.label', 'positive'] }, 1, 0] },
          },
        },
      },
    ]);

    const totalMentions = comparison.reduce((sum, c) => sum + c.totalMentions, 0);

    res.json({
      success: true,
      data: comparison.map(c => ({
        brandId: c._id,
        totalMentions: c.totalMentions,
        shareOfVoice: totalMentions ? Math.round((c.totalMentions / totalMentions) * 100) : 0,
        avgSentiment: Math.round(c.avgSentiment * 100) / 100,
        totalReach: c.totalReach,
        positivePct: Math.round(c.positivePct * 100),
      })),
    });
  } catch (error) {
    console.error('Error fetching competitor comparison:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch competitor comparison' });
  }
});

export default router;
