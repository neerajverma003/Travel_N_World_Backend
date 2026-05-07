import mongoose from "mongoose";

const destinationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["domestic", "international"],
      required: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    shortDescription: {
      type: String,
      trim: true,
    },
    coverImageUrl: {
      type: String,
    },
    gallery: [
      {
        type: String,
      },
    ],
    categories: {
      trending: { type: Boolean, default: false },
      exclusive: { type: Boolean, default: false },
      weekend: { type: Boolean, default: false },
      home: { type: Boolean, default: false },
      honeymoon: { type: Boolean, default: false },
    },
    priceFrom: {
      type: Number,
      default: 0,
    },
    discountedPrice: {
      type: Number,
      default: 0,
    },
    durationDays: {
      type: Number,
      default: 0,
    },
    durationNights: {
      type: Number,
      default: 0,
    },
    cities: [
      {
        type: String,
        trim: true,
      },
    ],
    itinerary: [
      {
        day: Number,
        title: String,
        description: String,
        image: String,
      },
    ],
    inclusions: [
      {
        type: String,
      },
    ],
    exclusions: [
      {
        type: String,
      },
    ],
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviews: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    ownerRole: {
      type: String,
    },
  },

  { timestamps: true }
);

export const Destination = mongoose.model("Destination", destinationSchema);
