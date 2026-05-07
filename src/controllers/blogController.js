import { Blog } from "../models/BlogModel.js";
import { AppError } from "../utils/errorHandler.js";
import { getPresignedViewUrl } from "../services/s3Service.js";

// Helper to sign blog URLs
const signBlog = async (blog) => {
  if (!blog) return null;
  const obj = blog.toObject ? blog.toObject() : blog;
  if (obj.coverImage) {
    obj.coverImage = await getPresignedViewUrl(obj.coverImage);
  }
  return obj;
};

// create new blog by admin
export const createBlog = async (req, res, next) => {
  try {
    const blog = await Blog.create(req.body);
    const signedBlog = await signBlog(blog);
    res.status(201).json({
      success: true,
      data: signedBlog
    });
  } catch (error) {
    next(new AppError("Failed to create blog", 500));
  }
};

export const getAllBlogs = async (req, res, next) => {
  try {
    const { isAdmin } = req.query;
    let query = { isPublished: true };

    if (isAdmin === 'true') {
      query = {};
    }

    const blogs = await Blog.find(query).sort({ createdAt: -1 });
    
    // Sign cover images for all blogs
    const signedBlogs = await Promise.all(
      blogs.map(blog => signBlog(blog))
    );

    res.status(200).json({ success: true, data: signedBlogs });
  } catch (error) {
    next(new AppError("Failed to fetch blogs", 500));
  }
};

// Single Blog find by slug
export const getBlogBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const blog = await Blog.findOne({ slug });
    if (!blog) return next(new AppError("Blog not found", 404));
    
    const signedBlog = await signBlog(blog);
    res.status(200).json({ success: true, data: signedBlog });
  } catch (error) {
    next(new AppError("Failed to fetch blog", 500));
  }
};

// get blog by ID (for admin edit)
export const getBlogById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id);
    if (!blog) return next(new AppError("Blog not found", 404));
    
    const signedBlog = await signBlog(blog);
    res.status(200).json({ success: true, data: signedBlog });
  } catch (error) {
    next(new AppError("Failed to fetch blog", 500));
  }
};

// update blog
export const updateBlog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findByIdAndUpdate(id, req.body, { new: true });
    if (!blog) return next(new AppError("Blog not found", 404));
    const signedBlog = await signBlog(blog);
    res.status(200).json({ success: true, data: signedBlog });
  } catch (error) {
    next(new AppError("Failed to update blog", 500));
  }
};
