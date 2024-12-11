import { Router } from 'express';
import { Brand } from '../models/Brand';

const router = Router();

// Get all brands
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;

    const query: any = {};
    if (userId) query.userId = userId;

    const brands = await Brand.find(query)
      .populate('competitors', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: brands });
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch brands' });
  }
});

// Get brand by ID
router.get('/:id', async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id)
      .populate('competitors');

    if (!brand) {
      return res.status(404).json({ success: false, error: 'Brand not found' });
    }

    res.json({ success: true, data: brand });
  } catch (error) {
    console.error('Error fetching brand:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch brand' });
  }
});

// Create brand
router.post('/', async (req, res) => {
  try {
    const {
      name,
      keywords,
      hashtags,
      handles,
      industry,
      settings,
      userId,
    } = req.body;

    const brand = await Brand.create({
      name,
      keywords: keywords || [name.toLowerCase()],
      hashtags: hashtags || [],
      handles: handles || {},
      industry,
      settings: settings || {},
      userId,
    });

    res.status(201).json({ success: true, data: brand });
  } catch (error) {
    console.error('Error creating brand:', error);
    res.status(500).json({ success: false, error: 'Failed to create brand' });
  }
});

// Update brand
router.put('/:id', async (req, res) => {
  try {
    const brand = await Brand.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!brand) {
      return res.status(404).json({ success: false, error: 'Brand not found' });
    }

    res.json({ success: true, data: brand });
  } catch (error) {
    console.error('Error updating brand:', error);
    res.status(500).json({ success: false, error: 'Failed to update brand' });
  }
});

// Delete brand
router.delete('/:id', async (req, res) => {
  try {
    const brand = await Brand.findByIdAndDelete(req.params.id);

    if (!brand) {
      return res.status(404).json({ success: false, error: 'Brand not found' });
    }

    res.json({ success: true, message: 'Brand deleted' });
  } catch (error) {
    console.error('Error deleting brand:', error);
    res.status(500).json({ success: false, error: 'Failed to delete brand' });
  }
});

// Add competitor
router.post('/:id/competitors', async (req, res) => {
  try {
    const { competitorId } = req.body;

    const brand = await Brand.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { competitors: competitorId } },
      { new: true }
    ).populate('competitors');

    if (!brand) {
      return res.status(404).json({ success: false, error: 'Brand not found' });
    }

    res.json({ success: true, data: brand });
  } catch (error) {
    console.error('Error adding competitor:', error);
    res.status(500).json({ success: false, error: 'Failed to add competitor' });
  }
});

export default router;
