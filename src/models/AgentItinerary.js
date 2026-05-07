/**
 * AgentItinerary Model
 * 
 * Stores itineraries specifically assigned to a particular agent.
 * These are created by the Superadmin but can be edited by the Agent.
 * They are displayed in the Agent's "Tours and Packages" section.
 */

import mongoose from "mongoose";

const dayPlanSchema = new mongoose.Schema(
  {
    day:            { type: Number, required: true },
    title:          { type: String, trim: true },
    locationDetail: { type: String, trim: true },
    images:         [{ type: String }],
  },
  { _id: false }
);

const agentItinerarySchema = new mongoose.Schema(
  {
    /* ── Identity & Assignment ────────────────────────────────────────── */
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      required: false,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    /* ── Travel Classification ─────────────────────────────────────────── */
    type: {
      type: String,
      enum: ["domestic", "international"],
      required: true,
      index: true,
    },
    destination: { type: String, trim: true, index: true },
    city:    { type: String, trim: true },
    country: { type: String, trim: true, index: true },
    departureDate: { type: Date },
    duration: { type: String, trim: true },
    durationDays: { type: Number, default: 0 },

    /* ── Categorisation ────────────────────────────────────────────────── */
    themes: [{ type: String, trim: true }],
    classification: [{ type: String, trim: true, index: true }],
    packageType: { type: String, default: "Flexible", trim: true },
    visibility: { type: String, default: "Public", trim: true },

    /* ── Content ───────────────────────────────────────────────────────── */
    shortDescription: { type: String, trim: true },
    destinationDetail: { type: String, trim: true },
    coverImageUrl: { type: String },
    gallery: [{ type: String }],

    /* ── Itinerary ─────────────────────────────────────────────────────── */
    dayPlans: [dayPlanSchema],

    /* ── Inclusions & Exclusions ───────────────────────────────────────── */
    inclusions: [{ type: String, trim: true }],
    exclusions: [{ type: String, trim: true }],

    /* ── Hotel ─────────────────────────────────────────────────────────── */
    asPerCategory: { type: Boolean, default: false },

    /* ── Pricing ───────────────────────────────────────────────────────── */
    asBestQuote:    { type: Boolean, default: false },
    priceFrom:      { type: Number, default: 0 },
    discountedPrice:{ type: Number, default: 0 },

    /* ── Policies ──────────────────────────────────────────────────────── */
    termsConditions:    { type: String, trim: true },
    paymentMode:        { type: String, trim: true },
    cancellationPolicy: { type: String, trim: true },

    /* ── Meta ──────────────────────────────────────────────────────────── */
    isPublished: { type: Boolean, default: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "creatorModel",
      required: true,
    },
    creatorModel: {
      type: String,
      required: true,
      enum: ["AdminLoginCredential", "Agent"],
    },
  },
  { timestamps: true }
);

// Pre-save hook to generate slug if not present
agentItinerarySchema.pre("validate", function(next) {
  if (this.title && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w ]+/g, "")
      .replace(/ +/g, "-") + "-" + Math.random().toString(36).substring(2, 7);
  }
  next();
});

export const AgentItinerary = mongoose.model("AgentItinerary", agentItinerarySchema);
