import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      trim: true,
      default: "Traveler",
    },
    content: {
      type: String,
      trim: true,
    },
    rating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5,
    },
    image: {
      type: String, // For Image Testimonials
    },
    type: {
      type: String,
      enum: ['text', 'video'],
      default: 'text'
    },
    location: {
      type: String,
      trim: true
    },
    videoUrl: {
      type: String, // For Video Testimonials
      trim: true
    },
    visibility: {
      type: String,
      enum: ['Public', 'Private'],
      default: 'Public'
    }
  },
  { timestamps: true }
);

export const Testimonial = mongoose.model("Testimonial", testimonialSchema);
