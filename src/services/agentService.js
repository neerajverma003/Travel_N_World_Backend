import mongoose from "mongoose";
import Agent from "../models/agent.js";
import User from "../models/User.js";
import AgentReview from "../models/AgentReview.js";
import { ROLES } from "../utils/constant.js";
import { AppError } from "../utils/errorHandler.js";
import bcrypt from "bcrypt";
import { cleanS3Data } from "../utils/agentUtils.js";

const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || "10", 10);

export const getAllAgents = async (page = 1, limit = 10, role, search = "", currentUser, agentCategory) => {
  const query = {};
  const userRole = (currentUser?.role || "").toUpperCase();
  if (currentUser && userRole === ROLES.RM) {
    query.relationshipManagerId = currentUser.id || currentUser._id;
  } else if (currentUser && userRole === ROLES.AGENT) {
    query._id = currentUser.id || currentUser._id;
  }
  if (role) {
    query.role = { $regex: new RegExp(`^${role}$`, "i") };
  }
  
  // Default to Travel agents for role=AGENT if category is not explicitly specified
  const normalizedRole = (role || "").toUpperCase();
  if (normalizedRole === ROLES.AGENT || !role) {
    if (!agentCategory || agentCategory === "Travel") {
      query.agentCategory = { $ne: "Transport" }; // matches "Travel" and documents without agentCategory
    } else if (agentCategory === "Transport") {
      query.agentCategory = "Transport";
    }
    // If agentCategory is "All", we do not apply agentCategory query filter.
  } else if (agentCategory && agentCategory !== "All") {
    query.agentCategory = agentCategory;
  }
  
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { company: { $regex: search, $options: "i" } },
    ];
  }
  
  const total = await Agent.countDocuments(query);
  const agents = await Agent.find(query)
    .populate("relationshipManagerId", "firstName lastName company email")
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 });

  return { 
    agents, 
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } 
  };
};

/**
 * Get all active agents for public display
 */
export const getVerifiedAgents = async (category = "Travel") => {
  const now = new Date();
  const query = {
    isVerified: true,
    isActive: true,
    $or: [
      {
        verificationStartDate: { $lte: now },
        verificationEndDate: { $gte: now }
      },
      {
        verificationStartDate: null,
        verificationEndDate: null
      } // Backward compatibility (purane records ke liye)
    ]
  };

  if (category === "Travel") {
    query.agentCategory = { $ne: "Transport" };
  } else if (category === "Transport") {
    query.agentCategory = "Transport";
  }

  return await Agent.find(query)
  .select("-password -registeredEmail -isActive")
  .sort({ rating: -1, createdAt: -1 });
};
/**
 * Get all active agents for public display
 */
export const getPublicAgents = async (category = "Travel") => {
  const query = { isActive: true, isVerified: false };

  if (category === "Travel") {
    query.agentCategory = { $ne: "Transport" };
  } else if (category === "Transport") {
    query.agentCategory = "Transport";
  }

  return await Agent.find(query)
    .select("-password -registeredEmail -isActive")
    .sort({ rating: -1, createdAt: -1 });
};

/**
 * Get agent profile by email
 */
export const getAgentByEmail = async (email) => {
  return await Agent.findOne({ email });
};

/**
 * Get single agent by ID with reviews
 */
export const getAgentById = async (id, publicOnly = false) => {
  let agent;
  const isObjectId = mongoose.Types.ObjectId.isValid(id);

  if (isObjectId) {
    const filter = { _id: id };
    if (publicOnly) filter.isActive = true;
    agent = await Agent.findOne(filter);
  } else {
    // Search by slug first (most accurate), then fallback to company name
    const companyName = id.replace(/-/g, " ").trim();
    const nameParts = companyName.split(" ");
    
    const baseFilter = publicOnly ? { isActive: true } : {};

    agent = await Agent.findOne({
      ...baseFilter,
      $or: [
        { slug: id.toLowerCase() }, // Direct slug match
        { company: { $regex: new RegExp(`^${companyName}$`, "i") } },
        {
          $and: [
            { firstName: { $regex: new RegExp(`^${nameParts[0]}$`, "i") } },
            { lastName: { $regex: new RegExp(`^${nameParts.slice(1).join(" ")}$`, "i") } }
          ]
        }
      ]
    }).sort({ updatedAt: -1 });

    // Final fallback: Fuzzy match on company name if still not found
    if (!agent && nameParts[0].length > 3) {
      agent = await Agent.findOne({
        ...baseFilter,
        company: { $regex: new RegExp(`^${nameParts[0]}`, "i") }
      }).sort({ updatedAt: -1 });
    }
  }

  if (!agent) {
    console.log(`[DEBUG] Agent not found for ID: "${id}" (publicOnly: ${publicOnly})`);
    throw new AppError("Agent profile not found or is currently inactive", 404);
  }
  
  // Optionally fetch recent reviews
  const reviews = await AgentReview.find({ agentId: agent._id })
    .sort({ createdAt: -1 })
    .limit(10);
    
  return { 
    agent, 
    reviews,
    testimonials: Array.isArray(agent.testimonials) ? agent.testimonials : [],
    reviewsList: Array.isArray(agent.reviewsList) ? agent.reviewsList : [],
    agentVideos: Array.isArray(agent.agentVideos) ? agent.agentVideos : [],
  };
};

/**
 * Create a new agent (Admin/Superadmin only)
 */
export const createAgent = async (data, loggedInUser) => {
  const normalizedEmail = typeof data.email === "string" ? data.email.toLowerCase().trim() : data.email;

  if (loggedInUser && (loggedInUser.role || "").toUpperCase() === ROLES.RM) {
    data.relationshipManagerId = loggedInUser.id || loggedInUser._id;
  }
  
  // Check if email already exists
  const existingByEmail = await Agent.findOne({ email: normalizedEmail });
  if (existingByEmail) throw new AppError("An agent with this email already exists", 400);

  // Check if phone already exists
  if (data.phone) {
    const existingByPhone = await Agent.findOne({ phone: data.phone });
    if (existingByPhone) throw new AppError("An agent with this phone number already exists", 400);
  }

  const requestedRole = data.role || ROLES.AGENT;
  if (requestedRole === ROLES.ADMIN && loggedInUser.role !== ROLES.SUPERADMIN) {
    throw new AppError("Unauthorized: Only SUPERADMIN can create ADMIN accounts", 403);
  }

  // 1. Create Auth User
  const user = new User({
    email: normalizedEmail,
    passwordHash: data.password,
    role: requestedRole,
    firstName: data.firstName,
    lastName: data.lastName,
  });
  await user.save();
  
  // Convert comma-separated strings to arrays for services and tags
  if (typeof data.services === "string") {
    data.services = data.services.split(",").map(s => s.trim()).filter(Boolean);
  }
  if (typeof data.tags === "string") {
    data.tags = data.tags.split(",").map(s => s.trim()).filter(Boolean);
  }

  // 2. Create Agent Profile
  const agent = new Agent({
    ...data,
    email: normalizedEmail,
    role: requestedRole,
    isActive: data.isActive !== undefined ? data.isActive : true,
  });
  
  await agent.save();
  return { agent, message: "Agent profile created successfully" };
};

/**
 * Update agent profile
 */
export const updateAgent = async (id, updateData, loggedInUser) => {
  // Clean S3 URLs (strip signatures/domains) before saving
  updateData = cleanS3Data(updateData);

  const agent = await Agent.findById(id).select("+password");
  if (!agent) throw new AppError("Agent not found", 404);
  
  // Authorization check: Superadmin can edit anyone; others can only edit themselves or lower-rank agents
  const isSelf = agent._id.toString() === loggedInUser.id;
  if (agent.role === ROLES.ADMIN && loggedInUser.role !== ROLES.SUPERADMIN && !isSelf) {
    throw new AppError("Unauthorized: You cannot modify another ADMIN's profile", 403);
  }

  // Prevent modification of sensitive/read-only fields
  delete updateData.email;
  delete updateData.password;
  delete updateData._id;
  delete updateData.id;
  delete updateData.__v;
  delete updateData.createdAt;
  delete updateData.updatedAt;
  delete updateData.isProfileComplete; // It's a virtual field

  // Restrict sensitive fields for non-SuperAdmins
  if (loggedInUser.role !== ROLES.SUPERADMIN) {
    delete updateData.role;
    delete updateData.isVerified;
    delete updateData.isActive;
    delete updateData.verificationStartDate;
    delete updateData.verificationEndDate;
  }

  // Dynamically map frontend keys to match Database schema
  if (updateData.profileImage !== undefined) {
    updateData.photo = updateData.profileImage;
    delete updateData.profileImage;
  }
  if (updateData.profilePhoto !== undefined) {
    updateData.photo = updateData.profilePhoto;
    delete updateData.profilePhoto;
  }
  if (updateData.banner !== undefined) {
    updateData.bannerImage = updateData.banner;
    delete updateData.banner;
  }

  // Validation to stop videos in image fields
  const isVideoUrl = (url) => typeof url === 'string' && /\.(mp4|mov|avi|webm|mkv)/i.test(url);
  if (updateData.photo && isVideoUrl(updateData.photo)) throw new AppError("Profile Photo must be an image", 400);
  
  // Convert comma-separated strings to arrays for services and tags
  if (typeof updateData.services === "string") {
    updateData.services = updateData.services.split(",").map(s => s.trim()).filter(Boolean);
  }
  if (typeof updateData.tags === "string") {
    updateData.tags = updateData.tags.split(",").map(s => s.trim()).filter(Boolean);
  }

  agent.set(updateData);
  
  // Use markModified for mixed types/arrays/rich-text to ensure Mongoose detects changes
  const modFields = ['agentPhotos', 'agentVideos', 'bannerImage', 'branchAddresses', 'testimonials', 'blogs', 'secondaryEmails', 'reviewsList', 'quickInfo', 'overview'];
  modFields.forEach(field => {
    if (updateData[field] !== undefined) {
      agent.markModified(field);
    }
  });

  await agent.save();
  
  // Sync core fields to User model if updated
  const userUpdate = {};
  if (typeof updateData.isActive === "boolean") userUpdate.isActive = updateData.isActive;
  if (updateData.role && Object.values(ROLES).includes(updateData.role)) userUpdate.role = updateData.role;
  if (updateData.firstName) userUpdate.firstName = updateData.firstName;
  if (updateData.lastName) userUpdate.lastName = updateData.lastName;
  
  if (Object.keys(userUpdate).length > 0) {
    await User.updateOne({ email: agent.email }, { $set: userUpdate });
  }
  
  return { agent, message: "Agent profile updated successfully" };
};

/**
 * Delete agent and associated user
 */
export const deleteAgent = async (id, loggedInUser) => {
  const agent = await Agent.findById(id);
  if (!agent) throw new AppError("Agent not found", 404);
  
  if (agent.role === ROLES.ADMIN && loggedInUser.role !== ROLES.SUPERADMIN) {
    throw new AppError("Unauthorized: You cannot delete an ADMIN account", 403);
  }

  await User.deleteOne({ email: agent.email });
  await Agent.deleteOne({ _id: agent._id });
  await AgentReview.deleteMany({ agentId: agent._id }); // Cleanup reviews
  
  return { message: "Agent and all associated data deleted successfully" };
};

/**
 * Add a review for an agent
 */
export const addAgentReview = async (agentId, reviewData, user) => {
  let agent;
  const isObjectId = mongoose.Types.ObjectId.isValid(agentId);
  if (isObjectId) {
    agent = await Agent.findById(agentId);
  } else {
    // Search by company name (slug) or firstName/lastName if not an ObjectId
    const companyName = agentId.replace(/-/g, " ").trim();
    const nameParts = companyName.split(" ");
    
    agent = await Agent.findOne({
      $or: [
        { company: { $regex: new RegExp(`^${companyName}$`, "i") } },
        {
          $and: [
            { firstName: { $regex: new RegExp(`^${nameParts[0]}$`, "i") } },
            { lastName: { $regex: new RegExp(`^${nameParts.slice(1).join(" ")}$`, "i") } }
          ]
        }
      ]
    });

    // Fuzzy match on company name
    if (!agent && nameParts[0].length > 3) {
      agent = await Agent.findOne({
        company: { $regex: new RegExp(nameParts[0], "i") }
      });
    }
  }
  
  if (!agent) throw new AppError("Agent not found", 404);
  
  // Use actual agent ID for the review document
  const actualAgentId = agent._id;

  const review = new AgentReview({
    agentId: actualAgentId,
    userId: user?._id,
    userName: user ? `${user.firstName} ${user.lastName}` : (reviewData.userName || "Guest Traveler"),
    rating: reviewData.rating,
    comment: reviewData.comment,
    tags: reviewData.tags || [],
    images: reviewData.images || [],
  });

  await review.save();
  return { review, message: "Review submitted successfully" };
};

export const toggleAgentStatus = async (id, isActive, loggedInUser) => {
  const agent = await Agent.findById(id);
  if (!agent) throw new AppError("Agent not found", 404);
  
  if (agent.role === ROLES.ADMIN && loggedInUser.role !== ROLES.SUPERADMIN) {
    throw new AppError("Unauthorized", 403);
  }
  
  agent.isActive = isActive;
  await agent.save();
  await User.updateOne({ email: agent.email }, { $set: { isActive } });
  
  return { agent, message: `Agent status updated to ${isActive ? "Active" : "Inactive"}` };
};

/**
 * Add a photo/video to an agent's gallery (Public/Owner)
 */
export const addAgentPhoto = async (id, photoUrl) => {
  const agent = await Agent.findById(id);
  if (!agent) throw new AppError("Agent not found", 404);

  // Distinguish between photo and video
  const isVideo = /\.(mp4|mov|avi|webm|mkv)/i.test(photoUrl);
  const updateField = isVideo ? "agentVideos" : "agentPhotos";

  const updatedAgent = await Agent.findByIdAndUpdate(
    id,
    { $push: { [updateField]: photoUrl } },
    { new: true, runValidators: true }
  );

  return { agent: updatedAgent };
};
