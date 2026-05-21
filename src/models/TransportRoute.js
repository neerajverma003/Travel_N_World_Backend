/**
 * TransportRoute Model
 *
 * Stores transport packages/routes created by SuperAdmin and assigned
 * to Transport Partners. Completely separate from travel AgentItinerary.
 *
 * Key differences from AgentItinerary:
 *  - No dayPlans, inclusions, exclusions, duration (nights/days)
 *  - Has: distanceKm, vehicleType, pricePerKm, fixedPrice, fromCity, toCity
 */

import mongoose from "mongoose";

const transportRouteSchema = new mongoose.Schema(
  {
    /* ── Identity & Assignment ─────────────────────────────────── */
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

    /* ── Route Details ──────────────────────────────────────────── */
    destination: { type: String, trim: true, required: true },
    type:        { type: String, enum: ["domestic", "international"], default: "domestic" },

    /* ── Vehicle & Service ──────────────────────────────────────── */
    vehicleType: {
      type: String,
      trim: true,
      default: "Sedan",
      // e.g. Sedan, SUV, Tempo Traveller, Bus, Luxury Van, Bike
    },
    serviceType: {
      type: String,
      trim: true,
      default: "One Way",
      // e.g. One Way, Round Trip, Local, Airport Transfer
    },

    /* ── Pricing ───────────────────────────────────────────────── */
    asBestQuote:    { type: Boolean, default: false },
    pricePerKm:     { type: Number, default: 0 },   // price per 1 km
    fixedPrice:     { type: Number, default: 0 },   // flat price for the route
    discountedPrice:{ type: Number, default: 0 }, // after discount

    /* ── Content ───────────────────────────────────────────────── */
    shortDescription: { type: String, trim: true },
    coverImageUrl:    { type: String },
    gallery:          [{ type: String }],

    /* ── Categorisation ─────────────────────────────────────────── */
    themes:         [{ type: String, trim: true }],
    classification: [{ type: String, trim: true }],
    visibility:     { type: String, default: "Public", trim: true },

    /* ── Policies ──────────────────────────────────────────────── */
    termsConditions:    { type: String, trim: true },
    paymentMode:        { type: String, trim: true },
    cancellationPolicy: { type: String, trim: true },

    /* ── Meta ──────────────────────────────────────────────────── */
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

// Auto-generate slug from title
transportRouteSchema.pre("validate", function (next) {
  if (this.title && !this.slug) {
    this.slug =
      this.title
        .toLowerCase()
        .replace(/[^\w ]+/g, "")
        .replace(/ +/g, "-") +
      "-" +
      Math.random().toString(36).substring(2, 7);
  }
  next();
});

export const TransportRoute = mongoose.model("TransportRoute", transportRouteSchema);
