import { Router } from 'express';
import { Alert } from '../models/Alert';

const router = Router();

// Get alerts
router.get('/', async (req, res) => {
  try {
    const { brandId, status, severity, limit = 20 } = req.query;

    const query: any = {};
    if (brandId) query.brandId = brandId;
    if (status) query.status = status;
    if (severity) query.severity = severity;

    const alerts = await Alert.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate('triggerMentions');

    res.json({ success: true, data: alerts });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch alerts' });
  }
});

// Get alert by ID
router.get('/:id', async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id)
      .populate('triggerMentions');

    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }

    res.json({ success: true, data: alert });
  } catch (error) {
    console.error('Error fetching alert:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch alert' });
  }
});

// Acknowledge alert
router.put('/:id/acknowledge', async (req, res) => {
  try {
    const { userId } = req.body;

    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        status: 'acknowledged',
        acknowledgedBy: userId,
        acknowledgedAt: new Date(),
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }

    // Emit socket event
    const io = req.app.get('io');
    io.to(`brand:${alert.brandId}`).emit('alert:acknowledged', alert);

    res.json({ success: true, data: alert });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({ success: false, error: 'Failed to acknowledge alert' });
  }
});

// Resolve alert
router.put('/:id/resolve', async (req, res) => {
  try {
    const { userId, resolution } = req.body;

    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      {
        status: 'resolved',
        resolvedBy: userId,
        resolvedAt: new Date(),
        resolution,
      },
      { new: true }
    );

    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }

    // Emit socket event
    const io = req.app.get('io');
    io.to(`brand:${alert.brandId}`).emit('alert:resolved', alert);

    res.json({ success: true, data: alert });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ success: false, error: 'Failed to resolve alert' });
  }
});

// Get alert statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const { brandId } = req.query;

    const match: any = {};
    if (brandId) match.brandId = brandId;

    const stats = await Alert.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
          },
          acknowledged: {
            $sum: { $cond: [{ $eq: ['$status', 'acknowledged'] }, 1, 0] },
          },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] },
          },
          critical: {
            $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] },
          },
          high: {
            $sum: { $cond: [{ $eq: ['$severity', 'high'] }, 1, 0] },
          },
        },
      },
    ]);

    res.json({
      success: true,
      data: stats[0] || {
        total: 0,
        active: 0,
        acknowledged: 0,
        resolved: 0,
        critical: 0,
        high: 0,
      },
    });
  } catch (error) {
    console.error('Error fetching alert stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch alert stats' });
  }
});

export default router;
