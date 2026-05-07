/**
 * Itinerary Controller
 *
 * Handles all CRUD operations and public-facing queries for travel itineraries.
 *
 * Public endpoints (no auth):
 *   GET /api/itineraries              → list with filters
 *   GET /api/itineraries/:slug        → single full detail
 *
 * Protected endpoints (ADMIN / SUPERADMIN):
 *   POST   /api/itineraries           → create
 *   PUT    /api/itineraries/:slug     → update
 *   DELETE /api/itineraries/:slug     → delete
 */

import { Itinerary } from "../models/Itinerary.js";
import slugify from "slugify";
import { getPresignedViewUrl } from "../services/s3Service.js";

/* ══════════════════════════════════════════════════════════════════════════ */
/*  HELPERS                                                                   */
/* ══════════════════════════════════════════════════════════════════════════ */

/**
 * Sign all S3 URLs in an itinerary document (recursive)
 */
async function signItinerary(itinerary) {
  if (!itinerary) return null;
  const obj = itinerary.toObject ? itinerary.toObject() : itinerary;

  // 1. Sign cover image
  if (obj.coverImageUrl) {
    obj.coverImageUrl = await getPresignedViewUrl(obj.coverImageUrl);
  }

  // 2. Sign gallery
  if (Array.isArray(obj.gallery)) {
    obj.gallery = await Promise.all(
      obj.gallery.map((img) => getPresignedViewUrl(img))
    );
  }

  // 3. Sign images in day plans
  if (Array.isArray(obj.dayPlans)) {
    obj.dayPlans = await Promise.all(
      obj.dayPlans.map(async (day) => {
        if (Array.isArray(day.images)) {
          day.images = await Promise.all(
            day.images.map((img) => getPresignedViewUrl(img))
          );
        }
        return day;
      })
    );
  }

  return obj;
}

/**
 * Fields returned for listing / card views (excludes heavy policy text).
 */
const CARD_SELECT =
  "_id title slug type destination city country duration durationDays " +
  "coverImageUrl gallery shortDescription priceFrom discountedPrice asBestQuote " +
  "themes classification packageType visibility createdAt";

/**
 * Generate a URL-safe slug from `base`.
 * Appends a numeric suffix (-2, -3 …) when the slug is already taken.
 *
 * @param {string} base  - Raw string to slugify (e.g. "Goa Beach Escape - Goa")
 * @returns {Promise<string>} Unique slug
 */
async function generateUniqueSlug(base) {
  const root = slugify(base, { lower: true, strict: true });
  let slug = root;
  let counter = 2;

  // eslint-disable-next-line no-await-in-loop
  while (await Itinerary.exists({ slug })) {
    slug = `${root}-${counter}`;
    counter += 1;
  }

  return slug;
}

/**
 * Parse a comma-separated string into a trimmed, non-empty array.
 * If the value is already an array it is returned as-is.
 *
 * @param {string|string[]} val
 * @returns {string[]}
 */
function toArray(val) {
  if (Array.isArray(val)) return val.map((s) => s.trim()).filter(Boolean);
  if (typeof val === "string")
    return val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  return [];
}

/**
 * Derive a numeric durationDays from a duration string like "3 Nights / 4 Days".
 * Falls back to 0 if the pattern is not found.
 *
 * @param {string} duration
 * @returns {number}
 */
function parseDurationDays(duration) {
  if (!duration) return 0;
  const match = duration.match(/(\d+)\s*day/i);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Map the AddItineraries form payload to Itinerary model fields.
 *
 * The form uses:
 *   travelType  → "Domestic" | "International"
 *   destination → name of the destination (e.g. "Goa", "Dubai")
 *   standardPrice → maps to priceFrom
 *   days        → array of { day, title, locationDetail }
 *
 * @param {object} payload
 * @returns {object} Model-ready data object
 */
function mapPayloadToModel(payload) {
  const {
    title,
    travelType,
    destination,
    duration,
    themes,
    classification,
    packageType,
    visibility,
    destinationDetail,
    days,
    inclusions,
    exclusions,
    asPerCategory,
    asBestQuote,
    standardPrice,
    discountedPrice,
    termsConditions,
    paymentMode,
    cancellationPolicy,
    mediaUrls,
  } = payload;

  const type = (travelType || "domestic").toLowerCase();

  return {
    title: (title || "").trim(),
    type,
    destination: (destination || "").trim(),
    // city / country set depending on type for backward-compatible filtering
    city: type === "domestic" ? (destination || "").trim() : undefined,
    country: type === "international" ? (destination || "").trim() : undefined,

    duration: duration || "",
    durationDays: parseDurationDays(duration),

    themes: Array.isArray(themes) ? themes : [],
    classification: Array.isArray(classification) ? classification : [],
    packageType: packageType || "Flexible",
    visibility: visibility || "Public",

    shortDescription: (destinationDetail || "").substring(0, 150).trim(),
    destinationDetail: (destinationDetail || "").trim(),

    // mediaUrls from the form become the gallery
    // The first uploaded media URL becomes the cover image for cards and the hero.
    // Remaining images go into the gallery array.
    coverImageUrl: Array.isArray(mediaUrls) && mediaUrls.length > 0 ? mediaUrls[0] : "",
    gallery: Array.isArray(mediaUrls) ? mediaUrls : [],

    // Map form day objects to dayPlan sub-documents
    dayPlans: (Array.isArray(days) ? days : []).map(({ day, title: dayTitle, locationDetail }) => ({
      day: Number(day) || 1,
      title: (dayTitle || "").trim(),
      locationDetail: (locationDetail || "").trim(),
    })),

    inclusions: toArray(inclusions),
    exclusions: toArray(exclusions),

    asPerCategory: Boolean(asPerCategory),
    asBestQuote: Boolean(asBestQuote),
    priceFrom: asBestQuote ? 0 : Number(standardPrice) || 0,
    discountedPrice: asBestQuote ? 0 : Number(discountedPrice) || 0,

    termsConditions: (termsConditions || "").trim(),
    paymentMode: (paymentMode || "").trim(),
    cancellationPolicy: (cancellationPolicy || "").trim(),

    isPublished: true,
  };
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  CREATE                                                                    */
/* ══════════════════════════════════════════════════════════════════════════ */

/**
 * POST /api/itineraries
 * Create a new itinerary from the AddItineraries admin form.
 *
 * Body: AddItineraries form payload (see mapPayloadToModel above)
 * Auth: ADMIN | SUPERADMIN
 */
export async function createItinerary(req, res) {
  try {
    const { title, travelType, destination } = req.body;

    /* ── Validate required fields ───────────────────────────────────────── */
    if (!title?.trim()) {
      return res.status(400).json({ message: "Itinerary title is required." });
    }
    if (!travelType) {
      return res
        .status(400)
        .json({ message: "Travel type (Domestic / International) is required." });
    }
    if (!destination?.trim()) {
      return res.status(400).json({ message: "Destination is required." });
    }

    /* ── Generate unique slug ───────────────────────────────────────────── */
    const slug = await generateUniqueSlug(`${title}-${destination}`);

    /* ── Build model document ───────────────────────────────────────────── */
    const data = mapPayloadToModel(req.body);

    const itinerary = new Itinerary({
      ...data,
      slug,
      createdBy: req.user?.id,
      ownerRole: req.user?.role,
    });

    await itinerary.save();

    const signedItinerary = await signItinerary(itinerary);
    return res.status(201).json({
      message: "Itinerary created successfully.",
      data: signedItinerary,
    });
  } catch (error) {
    console.error("Create Itinerary Error:", error);
    return res
      .status(500)
      .json({ message: "Error creating itinerary.", error: error.message });
  }
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  LIST / FILTER                                                             */
/* ══════════════════════════════════════════════════════════════════════════ */

/**
 * GET /api/itineraries
 * Return a paginated, filtered list of itinerary cards for public use.
 *
 * Query params:
 *   type           domestic | international
 *   destination    e.g. "goa" or "goa-beach-escape" (hyphens → spaces)
 *   classification e.g. "Trending" or "Trending,Exclusive" (comma-sep)
 *   limit          default 12
 *   skip           default 0
 */
export async function listItineraries(req, res) {
  try {
    const {
      type,
      destination,
      classification,
      limit = 12,
      skip = 0,
    } = req.query;

    /* ── Build MongoDB filter ───────────────────────────────────────────── */
    const filter = { isPublished: true, visibility: "Public" };

    if (type) {
      filter.type = type.toLowerCase();
    }

    if (destination) {
      // Accept URL-slug style ("goa-beaches") or plain name ("Goa Beaches")
      const destName = destination.replace(/-/g, " ");
      filter.destination = new RegExp(`^${destName}$`, "i");
    }

    if (classification) {
      // Support single or comma-separated values: ?classification=Trending,Exclusive
      const tags = toArray(classification);
      if (tags.length > 0) {
        filter.classification = { $in: tags };
      }
    }

    /* ── Query ──────────────────────────────────────────────────────────── */
    const [itineraries, total] = await Promise.all([
      Itinerary.find(filter)
        .select(CARD_SELECT)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit, 10))
        .skip(parseInt(skip, 10)),
      Itinerary.countDocuments(filter),
    ]);

    // Sign URLs for all itineraries
    const signedItineraries = await Promise.all(
      itineraries.map((it) => signItinerary(it))
    );

    return res.status(200).json({
      message: "Itineraries retrieved successfully.",
      data: signedItineraries,
      pagination: {
        total,
        limit: parseInt(limit, 10),
        skip: parseInt(skip, 10),
      },
    });
  } catch (error) {
    console.error("List Itineraries Error:", error);
    return res
      .status(500)
      .json({ message: "Error retrieving itineraries.", error: error.message });
  }
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  READ SINGLE                                                               */
/* ══════════════════════════════════════════════════════════════════════════ */

/**
 * GET /api/itineraries/:slug
 * Return the full document for a single itinerary (including day plans,
 * policy text, etc.) identified by its slug.
 */
export async function getBySlug(req, res) {
  try {
    const { slug } = req.params;

    const itinerary = await Itinerary.findOne({ slug });

    if (!itinerary) {
      return res.status(404).json({ message: "Itinerary not found." });
    }

    const signedItinerary = await signItinerary(itinerary);

    return res.status(200).json({
      message: "Itinerary retrieved successfully.",
      data: signedItinerary,
    });
  } catch (error) {
    console.error("Get Itinerary Error:", error);
    return res
      .status(500)
      .json({ message: "Error retrieving itinerary.", error: error.message });
  }
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  UPDATE                                                                    */
/* ══════════════════════════════════════════════════════════════════════════ */

/**
 * PUT /api/itineraries/:slug
 * Update an existing itinerary.  If title or destination changes, a new slug
 * is generated to keep URLs consistent.
 *
 * Auth: ADMIN | SUPERADMIN
 */
export async function updateItinerary(req, res) {
  try {
    const { slug } = req.params;

    /* ── Map form payload ───────────────────────────────────────────────── */
    const updateData = mapPayloadToModel(req.body);

    // Regenerate slug if the title or destination changed
    if (req.body.title || req.body.destination) {
      const baseTitle = req.body.title || slug;
      const baseDest = req.body.destination || "";
      updateData.slug = await generateUniqueSlug(`${baseTitle}-${baseDest}`);
    }

    const itinerary = await Itinerary.findOneAndUpdate(
      { slug },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!itinerary) {
      return res.status(404).json({ message: "Itinerary not found." });
    }

    const signedItinerary = await signItinerary(itinerary);
    return res.status(200).json({
      message: "Itinerary updated successfully.",
      data: signedItinerary,
    });
  } catch (error) {
    console.error("Update Itinerary Error:", error);
    return res
      .status(500)
      .json({ message: "Error updating itinerary.", error: error.message });
  }
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  DELETE                                                                    */
/* ══════════════════════════════════════════════════════════════════════════ */

/**
 * DELETE /api/itineraries/:slug
 * Permanently delete an itinerary.
 *
 * Auth: ADMIN | SUPERADMIN
 */
export async function deleteItinerary(req, res) {
  try {
    const { slug } = req.params;

    const deleted = await Itinerary.findOneAndDelete({ slug });

    if (!deleted) {
      return res.status(404).json({ message: "Itinerary not found." });
    }

    return res.status(200).json({
      message: "Itinerary deleted successfully.",
      data: deleted,
    });
  } catch (error) {
    console.error("Delete Itinerary Error:", error);
    return res
      .status(500)
      .json({ message: "Error deleting itinerary.", error: error.message });
  }
}
