import mongoose from "mongoose";

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true }, // URL ke liye (e.g., my-first-blog)
  content: { type: String, required: true }, // HTML content editor se aayega
  excerpt: { type: String }, // Chhota description card ke liye
  author: { type: String, default: "Admin" },
  coverImage: { type: String }, // Cloudinary image URL
  tags: [String],
  isPublished: { type: Boolean, default: false },
}, { timestamps: true });

export const Blog = mongoose.model("Blog", blogSchema);
