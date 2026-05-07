import HeroVideo from '../models/HeroVideo.js';
import { getPresignedViewUrl } from '../services/s3Service.js';

// GET all active videos (public)
export const getHeroVideos = async (req, res) => {
  try {
    const { page } = req.query;
    const filter = { isActive: true };
    if (page) {
      filter.title = page;
    }

    const videos = await HeroVideo.find(filter).sort({ order: 1 }).limit(10);

    const signed = await Promise.all(
      videos.map(async (v) => {
        const obj = v.toObject();
        if (obj.url && !obj.url.startsWith('http')) {
          obj.url = await getPresignedViewUrl(obj.url);
        }
        return obj;
      })
    );

    res.json({ data: signed });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching hero videos', error: err.message });
  }
};

// GET all videos (admin)
export const getAllHeroVideos = async (req, res) => {
  try {
    const videos = await HeroVideo.find().sort({ order: 1 });
    
    const signed = await Promise.all(
      videos.map(async (v) => {
        const obj = v.toObject();
        if (obj.url && !obj.url.startsWith('http')) {
          obj.url = await getPresignedViewUrl(obj.url);
        }
        return obj;
      })
    );

    res.json({ data: signed });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

// POST create
export const createHeroVideo = async (req, res) => {
  try {
    const { title, url, order } = req.body;
    
    // Limit to 10 videos per page/title
    const count = await HeroVideo.countDocuments({ title });
    if (count >= 10) return res.status(400).json({ message: `Maximum 10 hero videos allowed for ${title}.` });

    const totalCount = await HeroVideo.countDocuments();
    const video = await HeroVideo.create({ title, url, order: order ?? totalCount });
    res.status(201).json({ message: 'Created', data: video });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

// PUT update
export const updateHeroVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const video = await HeroVideo.findByIdAndUpdate(id, req.body, { new: true });
    if (!video) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Updated', data: video });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};

// DELETE
export const deleteHeroVideo = async (req, res) => {
  try {
    const { id } = req.params;
    await HeroVideo.findByIdAndDelete(id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error', error: err.message });
  }
};
