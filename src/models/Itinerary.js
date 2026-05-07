/**
 * Itinerary Model
 *
 * Stores complete travel package itineraries created via the admin dashboard.
 * Supports domestic and international packages, classification tags (Trending,
 * Exclusive, etc.), day-wise plans, pricing, and policy fields.
 */

import mongoose from "mongoose";

/* ── Day Plan Sub-schema ──────────────────────────────────────────────────── */
const dayPlanSchema = new mongoose.Schema(
  {
    day:            { type: Number, required: true },
    title:          { type: String, trim: true },
    locationDetail: { type: String, trim: true }, // Activities / description for the day
    images:         [{ type: String }],            // Optional day-specific images
  },
  { _id: false }
);

/* ── Itinerary Schema ─────────────────────────────────────────────────────── */
const itinerarySchema = new mongoose.Schema(
  {
    /* ── Identity ──────────────────────────────────────────────────────── */
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
    // "domestic" or "international" (maps to ITINERARY_TYPES)
    type: {
      type: String,
      enum: ["domestic", "international"],
      required: true,
      index: true,
    },
    // Human-readable destination name as entered in the form (e.g. "Goa", "Dubai")
    destination: { type: String, trim: true, index: true },
    // city is set for domestic packages
    city:    { type: String, trim: true },
    // country is set for international packages
    country: { type: String, trim: true, index: true },
    // Duration string from the dropdown (e.g. "3 Nights / 4 Days")
    duration: { type: String, trim: true },
    // Numeric days — derived from duration or set explicitly
    durationDays: { type: Number, default: 0 },

    /* ── Categorisation ────────────────────────────────────────────────── */
    // e.g. ["Family", "Beach", "Honeymoon"]
    themes: [{ type: String, trim: true }],
    // e.g. ["Trending", "Exclusive", "Weekend", "Top Selling"]
    classification: [{ type: String, trim: true, index: true }],
    // Package structure: Flexible | Fixed | Group | Customizable
    packageType: { type: String, default: "Flexible", trim: true },
    // Visibility on the public site: Public | Private | Draft
    visibility: { type: String, default: "Public", trim: true },

    /* ── Content ───────────────────────────────────────────────────────── */
    shortDescription: { type: String, trim: true },    // ≤150 char teaser
    destinationDetail: { type: String, trim: true },   // Full long description
    coverImageUrl: { type: String },
    gallery: [{ type: String }],                       // Extra images / media URLs

    /* ── Itinerary ─────────────────────────────────────────────────────── */
    dayPlans: [dayPlanSchema],

    /* ── Inclusions & Exclusions ───────────────────────────────────────── */
    inclusions: [{ type: String, trim: true }],
    exclusions: [{ type: String, trim: true }],

    /* ── Hotel ─────────────────────────────────────────────────────────── */
    asPerCategory: { type: Boolean, default: false }, // Hotel assigned by category

    /* ── Pricing ───────────────────────────────────────────────────────── */
    asBestQuote:    { type: Boolean, default: false }, // Hide fixed price; show "Get Quote"
    priceFrom:      { type: Number, default: 0 },      // Standard / original price (₹)
    discountedPrice:{ type: Number, default: 0 },      // Discounted price (₹)

    /* ── Policies ──────────────────────────────────────────────────────── */
    termsConditions:    { type: String, trim: true },
    paymentMode:        { type: String, trim: true },
    cancellationPolicy: { type: String, trim: true },

    /* ── Meta ──────────────────────────────────────────────────────────── */
    isPublished: { type: Boolean, default: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminLoginCredential",
      index: true,
    },
    ownerRole: { type: String },
  },
  { timestamps: true }
);

export const Itinerary = mongoose.model("Itinerary", itinerarySchema);
