import { Router } from 'express';
import { Mention } from '../models/Mention';

const router = Router();

// Get mentions with filters
router.get('/', async (req, res) => {
  try {
    const {
      brandId,
      platform,
      sentiment,
      startDate,
      endDate,
      search,
      limit = 50,
      offset = 0,
    } = req.query;

    const query: any = {};

    if (brandId) query.brandId = brandId;
    if (platform) query.platform = platform;
    if (sentiment) query['sentiment.label'] = sentiment;

    if (startDate || endDate) {
      query.postedAt = {};
      if (startDate) query.postedAt.$gte = new Date(startDate as string);
      if (endDate) query.postedAt.$lte = new Date(endDate as string);
    }

    if (search) {
      query.content = { $regex: search, $options: 'i' };
    }

    const [mentions, total] = await Promise.all([
      Mention.find(query)
        .sort({ postedAt: -1 })
        .skip(Number(offset))
        .limit(Number(limit))
        .lean(),
      Mention.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: mentions,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: Number(offset) + mentions.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching mentions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch mentions' });
  }
});

// Get single mention
router.get('/:id', async (req, res) => {
  try {
    const mention = await Mention.findById(req.params.id);

    if (!mention) {
      return res.status(404).json({ success: false, error: 'Mention not found' });
    }

    res.json({ success: true, data: mention });
  } catch (error) {
    console.error('Error fetching mention:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch mention' });
  }
});

// Get sentiment distribution
router.get('/stats/sentiment', async (req, res) => {
  try {
    const { brandId, startDate, endDate } = req.query;

    const match: any = {};
    if (brandId) match.brandId = brandId;
    if (startDate || endDate) {
      match.postedAt = {};
      if (startDate) match.postedAt.$gte = new Date(startDate as string);
      if (endDate) match.postedAt.$lte = new Date(endDate as string);
    }

    const stats = await Mention.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$sentiment.label',
          count: { $sum: 1 },
          avgScore: { $avg: '$sentiment.score' },
        },
      },
    ]);

    const total = stats.reduce((sum, s) => sum + s.count, 0);
    const distribution = stats.map(s => ({
      sentiment: s._id,
      count: s.count,
      percentage: Math.round((s.count / total) * 100),
      avgScore: Math.round(s.avgScore * 100) / 100,
    }));

    res.json({ success: true, data: { distribution, total } });
  } catch (error) {
    console.error('Error fetching sentiment stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sentiment stats' });
  }
});

// Get platform distribution
router.get('/stats/platforms', async (req, res) => {
  try {
    const { brandId, startDate, endDate } = req.query;

    const match: any = {};
    if (brandId) match.brandId = brandId;
    if (startDate || endDate) {
      match.postedAt = {};
      if (startDate) match.postedAt.$gte = new Date(startDate as string);
      if (endDate) match.postedAt.$lte = new Date(endDate as string);
    }

    const stats = await Mention.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$platform',
          count: { $sum: 1 },
          totalEngagement: {
            $sum: {
              $add: ['$engagement.likes', '$engagement.shares', '$engagement.comments'],
            },
          },
        },
      },
    ]);

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch platform stats' });
  }
});

// Get top influencers
router.get('/stats/influencers', async (req, res) => {
  try {
    const { brandId, limit = 10 } = req.query;

    const match: any = { isInfluencer: true };
    if (brandId) match.brandId = brandId;

    const influencers = await Mention.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$author.username',
          author: { $first: '$author' },
          mentionCount: { $sum: 1 },
          avgSentiment: { $avg: '$sentiment.score' },
          totalReach: { $sum: '$engagement.reach' },
        },
      },
      { $sort: { totalReach: -1 } },
      { $limit: Number(limit) },
    ]);

    res.json({ success: true, data: influencers });
  } catch (error) {
    console.error('Error fetching influencers:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch influencers' });
  }
});

export default router;
