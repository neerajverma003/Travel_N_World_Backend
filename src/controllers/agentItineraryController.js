/**
 * Agent Itinerary Controller
 *
 * Handles CRUD operations for itineraries assigned to specific agents.
 */

import { AgentItinerary } from "../models/AgentItinerary.js";
import slugify from "slugify";
import { ROLES } from "../utils/constant.js";
import { getPresignedViewUrl } from "../services/s3Service.js";
import mongoose from "mongoose";
import Agent from "../models/agent.js";
import { cleanS3Data } from "../utils/agentUtils.js";

/* ── Helpers ── */

const CARD_SELECT =
  "_id agentId title slug type destination city country duration durationDays departureDate " +
  "coverImageUrl gallery shortDescription destinationDetail dayPlans inclusions exclusions " +
  "termsConditions paymentMode cancellationPolicy priceFrom discountedPrice asBestQuote " +
  "themes classification packageType visibility createdAt";

/**
 * Sign S3 URLs in an agent itinerary document
 */
async function signAgentItinerary(itinerary) {
  if (!itinerary) return null;
  const obj = itinerary.toObject ? itinerary.toObject() : itinerary;

  if (obj.coverImageUrl) {
    obj.coverImageUrl = await getPresignedViewUrl(obj.coverImageUrl);
  }

  if (Array.isArray(obj.gallery)) {
    obj.gallery = await Promise.all(
      obj.gallery.map((img) => getPresignedViewUrl(img))
    );
  }

  return obj;
}

async function generateUniqueSlug(base) {
  const root = slugify(base, { lower: true, strict: true });
  let slug = root;
  let counter = 2;

  while (await AgentItinerary.exists({ slug })) {
    slug = `${root}-${counter}`;
    counter += 1;
  }
  return slug;
}

function toArray(val) {
  if (Array.isArray(val)) return val.map((s) => s.trim()).filter(Boolean);
  if (typeof val === "string")
    return val.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

function parseDurationDays(duration) {
  if (!duration) return 0;
  const match = duration.match(/(\d+)\s*day/i);
  return match ? parseInt(match[1], 10) : 0;
}

function mapPayloadToModel(payload) {
  const {
    title,
    travelType,
    type: modelType,
    destination,
    duration,
    themes,
    classification,
    packageType,
    visibility,
    destinationDetail,
    shortDescription,
    days,
    dayPlans,
    inclusions,
    exclusions,
    asPerCategory,
    asBestQuote,
    standardPrice,
    priceFrom,
    discountedPrice,
    termsConditions,
    paymentMode,
    cancellationPolicy,
    mediaUrls,
    gallery,
    agentId,
    departureDate,
  } = payload;

  const type = (modelType || travelType || "domestic").toLowerCase();

  return {
    agentId,
    title: (title || "").trim(),
    type,
    destination: (destination || "").trim(),
    city: type === "domestic" ? (destination || "").trim() : undefined,
    country: type === "international" ? (destination || "").trim() : undefined,
    departureDate: departureDate || undefined,
    duration: duration || "",
    durationDays: parseDurationDays(duration),
    themes: Array.isArray(themes) ? themes : [],
    classification: Array.isArray(classification) ? classification : [],
    packageType: packageType || "Flexible",
    visibility: visibility || "Public",
    shortDescription: (shortDescription || destinationDetail || "").trim(),
    destinationDetail: (destinationDetail || "").trim(),
    coverImageUrl: (gallery && gallery.length > 0) ? gallery[0] : (Array.isArray(mediaUrls) && mediaUrls.length > 0 ? mediaUrls[0] : ""),
    gallery: Array.isArray(gallery) ? gallery : (Array.isArray(mediaUrls) ? mediaUrls : []),
    dayPlans: (Array.isArray(dayPlans) ? dayPlans : (Array.isArray(days) ? days : [])).map(({ day, title: dayTitle, locationDetail }) => ({
      day: Number(day) || 1,
      title: (dayTitle || "").trim(),
      locationDetail: (locationDetail || "").trim(),
    })),
    inclusions: toArray(inclusions),
    exclusions: toArray(exclusions),
    asPerCategory: Boolean(asPerCategory),
    asBestQuote: Boolean(asBestQuote),
    priceFrom: (asBestQuote === true || asBestQuote === 'true') ? 0 : (priceFrom !== undefined ? Number(priceFrom) : (Number(standardPrice) || 0)),
    discountedPrice: (asBestQuote === true || asBestQuote === 'true') ? 0 : (discountedPrice !== undefined ? Number(discountedPrice) : 0),
    termsConditions: (termsConditions || "").trim(),
    paymentMode: (paymentMode || "").trim(),
    cancellationPolicy: (cancellationPolicy || "").trim(),
    isPublished: true,
  };
}

/* ── Controller Methods ── */

export async function createAgentItinerary(req, res) {
  try {
    const { title, travelType, destination, agentId } = req.body;
    let effectiveAgentId = agentId;
    if (!effectiveAgentId && req.user?.role === ROLES.AGENT) {
      effectiveAgentId = req.user.id;
    }

    const isAdmin = req.user?.role === ROLES.ADMIN || req.user?.role === ROLES.SUPERADMIN;
    const isRM = req.user?.role === ROLES.RM;

    if (isRM) {
      if (!effectiveAgentId) return res.status(400).json({ message: "Agent assignment is required." });
      const agentObj = await Agent.findById(effectiveAgentId);
      if (!agentObj || agentObj.relationshipManagerId?.toString() !== req.user.id) {
        return res.status(403).json({ message: "You can only create itineraries for your assigned agents." });
      }
    } else if (!effectiveAgentId && !isAdmin) {
      return res.status(400).json({ message: "Agent assignment is required." });
    }

    if (!title?.trim()) return res.status(400).json({ message: "Title is required." });
    if (!travelType) return res.status(400).json({ message: "Travel type is required." });
    if (!destination?.trim()) return res.status(400).json({ message: "Destination is required." });

    const slug = await generateUniqueSlug(`${title}-${destination}`);
    req.body.agentId = effectiveAgentId;
    const data = cleanS3Data(mapPayloadToModel(req.body));

    const itinerary = new AgentItinerary({
      ...data,
      slug,
      createdBy: req.user?.id,
      creatorModel: (req.user?.role === ROLES.AGENT || req.user?.role === ROLES.RM) ? "Agent" : "AdminLoginCredential",
    });

    await itinerary.save();
    const signedItinerary = await signAgentItinerary(itinerary);
    return res.status(201).json({ message: "Agent itinerary created successfully.", data: signedItinerary });
  } catch (error) {
    console.error("Create Agent Itinerary Error:", error);
    return res.status(500).json({ message: "Error creating agent itinerary.", error: error.message });
  }
}

export async function listAgentItineraries(req, res) {
  try {
    const { agentId, type, destination, classification, limit = 12, skip = 0 } = req.query;
    
    const filter = {};
    
    const isAdmin = req.user?.role === ROLES.ADMIN || req.user?.role === ROLES.SUPERADMIN;
    const isAgent = req.user?.role === ROLES.AGENT;
    const isRM = req.user?.role === ROLES.RM;

    // Default to published only for everyone except admins and RMs
    // console.log("DEBUG listAgentItineraries:", { user: req.user, isAdmin, isAgent, isRM });
    if (!isAdmin && !isRM) {
      filter.isPublished = true;
    }

    if (isRM) {
      // RM Panel View: Show only itineraries of agents assigned to this RM
      const managedAgents = await Agent.find({ relationshipManagerId: req.user.id }).select("_id");
      const agentIds = managedAgents.map(a => a._id);
 
      
      delete filter.isPublished; // Show drafts of their assigned agents

      if (agentId === "agents_only" || !agentId || agentId === "all") {
        filter.agentId = { $in: agentIds };
      } else {
        let targetId = agentId;
        if (!mongoose.Types.ObjectId.isValid(agentId)) {
          const companyName = agentId.replace(/-/g, " ");
          const agent = await Agent.findOne({ company: { $regex: new RegExp(`^${companyName}$`, "i") } });
          targetId = agent ? agent._id : null;
        }

        if (targetId && agentIds.some(id => id.toString() === targetId.toString())) {
          filter.agentId = targetId;
        } else {
          return res.status(200).json({
            message: "Agent itineraries retrieved successfully.",
            data: [],
            pagination: { total: 0, limit: parseInt(limit, 10), skip: parseInt(skip, 10) },
          });
        }
      }
    } else if (isAgent) {
      // Agent Panel View: If no specific agentId is passed, or if it's their own ID
      // We show everything they own (assigned by admin OR created by them)
      if (!agentId || agentId === req.user.id || agentId === "all") {
        delete filter.isPublished; // Show drafts in dashboard
        filter.$or = [
          { agentId: req.user.id },
          { createdBy: req.user.id }
        ];
      } else {
        // Agent viewing a specific profile (could be their own public profile or another's)
        if (mongoose.Types.ObjectId.isValid(agentId)) {
          filter.agentId = agentId;
        } else {
          const companyName = agentId.replace(/-/g, " ");
          const agent = await Agent.findOne({ company: { $regex: new RegExp(`^${companyName}$`, "i") } });
          if (agent) filter.agentId = agent._id;
        }
      }
    } else if (isAdmin) {
      // Admins can see all
      delete filter.isPublished;
      if (agentId === "admin") {
        filter.agentId = { $in: [null, undefined] };
      } else if (agentId === "agents_only") {
        filter.agentId = { $ne: null };
      } else if (agentId && agentId !== "all") {
        if (mongoose.Types.ObjectId.isValid(agentId)) {
          filter.agentId = agentId;
        } else {
          const companyName = agentId.replace(/-/g, " ");
          const agent = await Agent.findOne({ company: { $regex: new RegExp(`^${companyName}$`, "i") } });
          if (agent) filter.agentId = agent._id;
        }
      }
    } else {
      // Public / Unauthenticated
      filter.isPublished = true;

      if (agentId && agentId !== "all" && agentId !== "agents_only") {
        if (mongoose.Types.ObjectId.isValid(agentId)) {
          filter.agentId = agentId;
        } else {
          const companyName = agentId.replace(/-/g, " ");
          const agent = await Agent.findOne({ company: { $regex: new RegExp(`^${companyName}$`, "i") } });
          if (agent) filter.agentId = agent._id;
          else return res.status(200).json({ data: [], pagination: { total: 0, limit: parseInt(limit, 10), skip: parseInt(skip, 10) } });
        }
      }
    }

    if (type && type !== "All") filter.type = type.toLowerCase();
    
    if (destination) {
      const searchStr = destination.replace(/-/g, " ");
      filter.$or = [
        { destination: { $regex: searchStr, $options: "i" } },
        { title: { $regex: searchStr, $options: "i" } },
        { city: { $regex: searchStr, $options: "i" } },
        { country: { $regex: searchStr, $options: "i" } }
      ];
    }
    if (classification) {
      const tags = toArray(classification);
      if (tags.length > 0) filter.classification = { $in: tags };
    }

    const [itineraries, total] = await Promise.all([
      AgentItinerary.find(filter)
        .select(CARD_SELECT)
        .populate("agentId", "company firstName lastName email")
        .sort({ createdAt: -1 })
        .limit(parseInt(limit, 10))
        .skip(parseInt(skip, 10)),
      AgentItinerary.countDocuments(filter),
    ]);

    const signedItineraries = await Promise.all(
      itineraries.map((it) => signAgentItinerary(it))
    );

    return res.status(200).json({
      message: "Agent itineraries retrieved successfully.",
      data: signedItineraries,
      pagination: { total, limit: parseInt(limit, 10), skip: parseInt(skip, 10) },
    });
  } catch (error) {
    console.error("List Agent Itineraries Error:", error);
    return res.status(500).json({ message: "Error retrieving agent itineraries.", error: error.message });
  }
}

export async function getAgentItineraryBySlug(req, res) {
  try {
    const { slug } = req.params;
    let itinerary;

    if (mongoose.Types.ObjectId.isValid(slug)) {
      itinerary = await AgentItinerary.findById(slug);
    } else {
      itinerary = await AgentItinerary.findOne({ slug });
    }

    if (!itinerary) return res.status(404).json({ message: "Itinerary not found." });

    const signedItinerary = await signAgentItinerary(itinerary);
    return res.status(200).json({ message: "Itinerary retrieved successfully.", data: signedItinerary });
  } catch (error) {
    return res.status(500).json({ message: "Error retrieving itinerary.", error: error.message });
  }
}

export async function updateAgentItinerary(req, res) {
  try {
    const { slug } = req.params;
    const updateData = cleanS3Data(mapPayloadToModel(req.body));

    let existing;
    if (mongoose.Types.ObjectId.isValid(slug)) {
      existing = await AgentItinerary.findById(slug);
    } else {
      existing = await AgentItinerary.findOne({ slug });
    }
    
    if (!existing) return res.status(404).json({ message: "Itinerary not found." });

    // Authorization check: Only assigned agent, owning RM, or admin can update
    if (req.user.role === ROLES.AGENT && existing.agentId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized to update this itinerary." });
    }

    if (req.user.role === ROLES.RM) {
      if (!existing.agentId) {
        return res.status(403).json({ message: "Unauthorized to update this itinerary." });
      }
      const agentObj = await Agent.findById(existing.agentId);
      if (!agentObj || agentObj.relationshipManagerId?.toString() !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized to update this itinerary." });
      }
    }

    if (req.body.title || req.body.destination) {
      const baseTitle = req.body.title || existing.title;
      const baseDest = req.body.destination || existing.destination;
      updateData.slug = await generateUniqueSlug(`${baseTitle}-${baseDest}`);
    }

    let itinerary;
    if (mongoose.Types.ObjectId.isValid(slug)) {
      itinerary = await AgentItinerary.findByIdAndUpdate(slug, { $set: updateData }, { new: true, runValidators: true });
    } else {
      itinerary = await AgentItinerary.findOneAndUpdate({ slug }, { $set: updateData }, { new: true, runValidators: true });
    }

    const signedItinerary = await signAgentItinerary(itinerary);
    return res.status(200).json({ message: "Itinerary updated successfully.", data: signedItinerary });
  } catch (error) {
    console.error("Update Agent Itinerary Error:", error);
    return res.status(500).json({ message: "Error updating itinerary.", error: error.message });
  }
}

export async function deleteAgentItinerary(req, res) {
  try {
    const { slug } = req.params;
    let existing;
    if (mongoose.Types.ObjectId.isValid(slug)) {
      existing = await AgentItinerary.findById(slug);
    } else {
      existing = await AgentItinerary.findOne({ slug });
    }
    if (!existing) return res.status(404).json({ message: "Itinerary not found." });

    // Authorization check
    if (req.user.role === ROLES.AGENT && existing.agentId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized to delete this itinerary." });
    }

    if (req.user.role === ROLES.RM) {
      if (!existing.agentId) {
        return res.status(403).json({ message: "Unauthorized to delete this itinerary." });
      }
      const agentObj = await Agent.findById(existing.agentId);
      if (!agentObj || agentObj.relationshipManagerId?.toString() !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized to delete this itinerary." });
      }
    }

    if (mongoose.Types.ObjectId.isValid(slug)) {
      await AgentItinerary.findByIdAndDelete(slug);
    } else {
      await AgentItinerary.findOneAndDelete({ slug });
    }
    return res.status(200).json({ message: "Itinerary deleted successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting itinerary.", error: error.message });
  }
}

