import { Testimonial } from "../models/Testimonial.js";
import { getPresignedViewUrl } from "../services/s3Service.js";

// Get all testimonials
export const getTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });
    
    const signedTestimonials = await Promise.all(
      testimonials.map(async (t) => {
        const tObj = t.toObject();
        tObj.image = await getPresignedViewUrl(t.image);
        // Only sign videoUrl if it looks like an S3 link (extracted by getPresignedViewUrl logic)
        if (t.videoUrl) {
          tObj.videoUrl = await getPresignedViewUrl(t.videoUrl);
        }
        return tObj;
      })
    );

    res.status(200).json({ success: true, data: signedTestimonials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create testimonial
export const createTestimonial = async (req, res) => {
  try {
    let { name, role, content, rating, image, type, location, videoUrl, visibility } = req.body;
    
    const testimonial = await Testimonial.create({
      name,
      role,
      content,
      rating,
      image,
      type: type || 'text',
      location,
      videoUrl,
      visibility: visibility || 'Public'
    });
    res.status(201).json({ success: true, data: testimonial });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update testimonial
export const updateTestimonial = async (req, res) => {
  try {
    let updateData = { ...req.body };
    
    const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!testimonial) return res.status(404).json({ success: false, message: "Testimonial not found" });
    res.status(200).json({ success: true, data: testimonial });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete testimonial
export const deleteTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
    if (!testimonial) return res.status(404).json({ success: false, message: "Testimonial not found" });
    res.status(200).json({ success: true, message: "Testimonial deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

