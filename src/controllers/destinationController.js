import { Destination } from "../models/Destination.js";
import slugify from "slugify";
import { getPresignedViewUrl } from "../services/s3Service.js";

/**
 * Sign all S3 URLs in a destination document
 */
async function signDestination(destination) {
  if (!destination) return null;
  const obj = destination.toObject ? destination.toObject() : destination;

  if (obj.coverImageUrl) {
    obj.coverImageUrl = await getPresignedViewUrl(obj.coverImageUrl);
  }

  if (Array.isArray(obj.gallery)) {
    obj.gallery = await Promise.all(
      obj.gallery.map((img) => getPresignedViewUrl(img))
    );
  }

  if (Array.isArray(obj.itinerary)) {
    obj.itinerary = await Promise.all(
      obj.itinerary.map(async (item) => {
        if (item.image) {
          item.image = await getPresignedViewUrl(item.image);
        }
        return item;
      })
    );
  }

  return obj;
}

// Create a new destination
export async function createDestination(req, res) {
  try {
    let {
      name,
      type,
      description,
      shortDescription,
      coverImageUrl,
      gallery,
      categories,
      priceFrom,
      discountedPrice,
      durationDays,
      durationNights,
      cities,
      itinerary,
      inclusions,
      exclusions,
      rating,
      reviews,
    } = req.body;

    // Parse JSON strings from FormData with safety
    const safeParse = (data) => {
      if (typeof data === 'string' && data.trim() !== '') {
        try {
          return JSON.parse(data);
        } catch (e) {
          return data;
        }
      }
      return data;
    };

    categories = safeParse(categories);
    gallery = safeParse(gallery);
    cities = safeParse(cities);
    itinerary = safeParse(itinerary);
    inclusions = safeParse(inclusions);
    exclusions = safeParse(exclusions);

    // Validation
    if (!name || !type) {
      return res.status(400).json({
        message: "name and type (domestic/international) are required",
      });
    }

    if (!["domestic", "international"].includes(type.toLowerCase())) {
      return res.status(400).json({
        message: "type must be either 'domestic' or 'international'",
      });
    }

    // Generate slug
    const slug = slugify(name, { lower: true, strict: true });

    // Check if destination already exists
    const exists = await Destination.findOne({ slug });
    if (exists) {
      return res.status(409).json({
        message: "Destination with this name already exists",
      });
    }

    // Create destination
    const destination = new Destination({
      name,
      slug,
      type: type.toLowerCase(),
      description,
      shortDescription,
      coverImageUrl,
      gallery: Array.isArray(gallery) ? gallery : [],
      categories: categories || {},
      priceFrom: Number(priceFrom) || 0,
      discountedPrice: Number(discountedPrice) || 0,
      durationDays: Number(durationDays) || 0,
      durationNights: Number(durationNights) || 0,
      cities: Array.isArray(cities) ? cities : [],
      itinerary: Array.isArray(itinerary) ? itinerary : [],
      inclusions: Array.isArray(inclusions) ? inclusions : [],
      exclusions: Array.isArray(exclusions) ? exclusions : [],
      rating: Number(rating) || 0,
      reviews: Number(reviews) || 0,
      createdBy: req.user?.id,
      ownerRole: req.user?.role,
    });

    await destination.save();

    const signedDestination = await signDestination(destination);
    return res.status(201).json({
      message: "Destination created successfully",
      data: signedDestination,
    });
  } catch (error) {
    console.error("Create Destination Error:", error);
    return res.status(500).json({
      message: "Error creating destination",
      error: error.message,
    });
  }
}

// Get all destinations with filters
export async function listDestinations(req, res) {
  try {
    const { type, category, isPublished, limit = 10, skip = 0 } = req.query;

    let filter = {};

    if (type) {
      filter.type = type;
    }

    if (isPublished !== undefined) {
      filter.isPublished = isPublished === "true";
    }

    if (category) {
      filter[`categories.${category}`] = true;
    }

    const destinations = await Destination.find(filter)
      .select(
        "_id name slug type shortDescription coverImageUrl priceFrom discountedPrice durationDays durationNights rating reviews categories"
      )
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ createdAt: -1 });

    const total = await Destination.countDocuments(filter);

    // Sign URLs for list view
    const signedDestinations = await Promise.all(
      destinations.map((dest) => signDestination(dest))
    );

    return res.status(200).json({
      message: "Destinations retrieved successfully",
      data: signedDestinations,
      pagination: {
        total,
        limit: parseInt(limit),
        skip: parseInt(skip),
      },
    });
  } catch (error) {
    console.error("List Destinations Error:", error);
    return res.status(500).json({
      message: "Error retrieving destinations",
      error: error.message,
    });
  }
}

// Get destination by slug
export async function getDestinationBySlug(req, res) {
  try {
    const { slug } = req.params;

    const destination = await Destination.findOne({ slug })
      .populate("createdBy", "name email");

    if (!destination) {
      return res.status(404).json({
        message: "Destination not found",
      });
    }

    const signedDestination = await signDestination(destination);

    return res.status(200).json({
      message: "Destination retrieved successfully",
      data: signedDestination,
    });
  } catch (error) {
    console.error("Get Destination Error:", error);
    return res.status(500).json({
      message: "Error retrieving destination",
      error: error.message,
    });
  }
}

// Get destination by ID
export async function getDestinationById(req, res) {
  try {
    const { id } = req.params;

    const destination = await Destination.findById(id).populate(
      "createdBy",
      "name email"
    );

    if (!destination) {
      return res.status(404).json({
        message: "Destination not found",
      });
    }

    const signedDestination = await signDestination(destination);

    return res.status(200).json({
      message: "Destination retrieved successfully",
      data: signedDestination,
    });
  } catch (error) {
    console.error("Get Destination By ID Error:", error);
    return res.status(500).json({
      message: "Error retrieving destination",
      error: error.message,
    });
  }
}

// Get cards for displaying on frontend
export async function getDestinationCards(req, res) {
  try {
    const { type, category, limit = 8 } = req.query;

    let filter = { isPublished: true };

    if (type) {
      filter.type = type;
    }

    if (category) {
      const catKey = category.toLowerCase();
      filter[`categories.${catKey}`] = true;
    }

    let destinations = await Destination.find(filter)
      .select(
        "_id name slug type shortDescription coverImageUrl priceFrom discountedPrice durationDays durationNights rating reviews categories"
      )
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    // Fallback: If category has no results, return latest destinations
    if (destinations.length === 0 && category) {
      destinations = await Destination.find({ isPublished: true })
        .select("_id name slug type shortDescription coverImageUrl priceFrom discountedPrice durationDays durationNights rating reviews categories")
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });
    }

    const signedDestinations = await Promise.all(
      destinations.map((dest) => signDestination(dest))
    );

    return res.status(200).json({
      message: "Destination cards retrieved successfully",
      data: signedDestinations,
    });
  } catch (error) {
    console.error("Get Destination Cards Error:", error);
    return res.status(500).json({
      message: "Error retrieving destination cards",
      error: error.message,
    });
  }
}

// Update destination
export async function updateDestination(req, res) {
  try {
    const { id } = req.params;
    let updateData = req.body;

    // Parse JSON strings from FormData
    if (typeof updateData.categories === 'string') updateData.categories = JSON.parse(updateData.categories);
    if (typeof updateData.gallery === 'string') updateData.gallery = JSON.parse(updateData.gallery);
    if (typeof updateData.cities === 'string') updateData.cities = JSON.parse(updateData.cities);
    if (typeof updateData.itinerary === 'string') updateData.itinerary = JSON.parse(updateData.itinerary);
    if (typeof updateData.inclusions === 'string') updateData.inclusions = JSON.parse(updateData.inclusions);
    if (typeof updateData.exclusions === 'string') updateData.exclusions = JSON.parse(updateData.exclusions);

    // If name is being updated, regenerate slug
    if (updateData.name) {
      updateData.slug = slugify(updateData.name, {
        lower: true,
        strict: true,
      });

      // Check if new slug already exists
      const existingDestination = await Destination.findOne({
        slug: updateData.slug,
        _id: { $ne: id },
      });

      if (existingDestination) {
        return res.status(409).json({
          message: "Destination with this name already exists",
        });
      }
    }

    const destination = await Destination.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!destination) {
      return res.status(404).json({
        message: "Destination not found",
      });
    }

    const signedDestination = await signDestination(destination);
    return res.status(200).json({
      message: "Destination updated successfully",
      data: signedDestination,
    });
  } catch (error) {
    console.error("Update Destination Error:", error);
    return res.status(500).json({
      message: "Error updating destination",
      error: error.message,
    });
  }
}

// Delete destination
export async function deleteDestination(req, res) {
  try {
    const { id } = req.params;

    const destination = await Destination.findByIdAndDelete(id);

    if (!destination) {
      return res.status(404).json({
        message: "Destination not found",
      });
    }

    return res.status(200).json({
      message: "Destination deleted successfully",
      data: destination,
    });
  } catch (error) {
    console.error("Delete Destination Error:", error);
    return res.status(500).json({
      message: "Error deleting destination",
      error: error.message,
    });
  }
}

// Get destinations by type
export async function getDestinationsByType(req, res) {
  try {
    const { type } = req.params;

    if (!["domestic", "international"].includes(type)) {
      return res.status(400).json({
        message: "type must be either 'domestic' or 'international'",
      });
    }

    const destinations = await Destination.find({
      type,
      isPublished: true,
    })
      .select(
        "_id name slug type shortDescription coverImageUrl priceFrom discountedPrice durationDays durationNights rating reviews categories"
      )
      .sort({ createdAt: -1 });

    const signedDestinations = await Promise.all(
      destinations.map((dest) => signDestination(dest))
    );

    return res.status(200).json({
      message: "Destinations retrieved successfully",
      data: signedDestinations,
    });
  } catch (error) {
    console.error("Get Destinations By Type Error:", error);
    return res.status(500).json({
      message: "Error retrieving destinations",
      error: error.message,
    });
  }
}

