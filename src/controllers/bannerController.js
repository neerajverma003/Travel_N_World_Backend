import Banner from "../models/banner.js";
import { getPresignedViewUrl } from "../services/s3Service.js";

// TOGGLE 
export const toggleBannerStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findById(id);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    banner.isActive = !banner.isActive;
    await banner.save();

    res.json(banner);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE
export const createBanner = async (req, res) => {
  try {
    const { title, desc, startDate, endDate, link, position, order, imageUrl, imagePublicId } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ message: "imageUrl is required" });
    }

    const banner = await Banner.create({
      title,
      desc,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      link,
      position,
      order,
      imageUrl,
      imagePublicId: imagePublicId || `banner_${Date.now()}`,
    });

    const bObj = banner.toObject();
    if (bObj.imageUrl) {
      bObj.imageUrl = await getPresignedViewUrl(bObj.imageUrl);
    }

    res.status(201).json(bObj);
  } catch (err) {
    console.error("createBanner error:", err);
    res.status(500).json({ message: err.message });
  }
};

// GET
export const getBanners = async (req, res) => {
  try {
    const { position, admin } = req.query;

    let filter = {};

    if (!admin) {
      filter.isActive = true; // public only sees active
    }

    if (position) filter.position = position;

    const banners = await Banner.find(filter).sort({ order: 1 });

    // SIGN URLs for Private S3
    const signedBanners = await Promise.all(
      banners.map(async (b) => {
        const bObj = b.toObject();
        if (bObj.imageUrl) {
          bObj.imageUrl = await getPresignedViewUrl(bObj.imageUrl);
        }
        return bObj;
      })
    );

    res.json(signedBanners);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE
export const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findById(id);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    const { title, desc, startDate, endDate, link, position, order, isActive, imageUrl, imagePublicId } = req.body;

    banner.title = title || banner.title;
    banner.desc = desc || banner.desc;
    if (req.body.hasOwnProperty("startDate")) {
      banner.startDate = startDate ? new Date(startDate) : null;
    }
    if (req.body.hasOwnProperty("endDate")) {
      banner.endDate = endDate ? new Date(endDate) : null;
    }
    banner.link = link || banner.link;
    banner.position = position || banner.position;
    banner.order = order || banner.order;
    banner.isActive = isActive ?? banner.isActive;

    if (imageUrl) {
      banner.imageUrl = imageUrl;
      banner.imagePublicId = imagePublicId || banner.imagePublicId;
    }

    await banner.save();

    const bObj = banner.toObject();
    if (bObj.imageUrl) {
      bObj.imageUrl = await getPresignedViewUrl(bObj.imageUrl);
    }

    res.json(bObj);
  } catch (err) {
    console.error("updateBanner error:", err);
    res.status(500).json({ message: err.message });
  }
};

// DELETE
export const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findById(id);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    // Note: S3 deletion could be added here if needed
    await banner.deleteOne();

    res.json({ message: "Banner deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};