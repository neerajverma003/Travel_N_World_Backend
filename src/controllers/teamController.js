import Agent from "../models/agent.js";
import User from "../models/User.js";
import { ROLES } from "../utils/constant.js";
import { AppError } from "../utils/errorHandler.js";

/**
 * @desc Get all team members for the logged-in agent
 * @route GET /api/team
 * @access Private (Agent)
 */
export const getTeamMembers = async (req, res, next) => {
  try {
    const agentId = req.user.id;
    const team = await Agent.find({ parentId: agentId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      total: team.length,
      data: team,
    });
  } catch (error) {
    console.error("Error fetching team members:", error);
    next(new AppError("Failed to fetch team members", 500));
  }
};

/**
 * @desc Add a new team member
 * @route POST /api/team
 * @access Private (Agent)
 */
export const addTeamMember = async (req, res, next) => {
  try {
    const parentAgentId = req.user.id;
    const { firstName, lastName, email, phone, password, role } = req.body;

    if (!email || !password || !firstName) {
      return next(new AppError("Please provide firstName, email and password", 400));
    }

    const normalizedEmail = email.toLowerCase().trim();

    //   Check if email already exists in Agent or User model
    const [existingAgent, existingUser] = await Promise.all([
      Agent.findOne({ email: normalizedEmail }),
      User.findOne({ email: normalizedEmail })
    ]);

    if (existingAgent || existingUser) {
      return next(new AppError("This email is already registered. Please use a different email address.", 400));
    }

    // 1. Create Auth User
    const user = new User({
      email: normalizedEmail,
      passwordHash: password,
      role: ROLES.AGENT, // Team members are also agents but with a parent
      firstName,
      lastName,
    });
    await user.save();

    // 2. Create Agent Profile
    const newMember = new Agent({
      firstName,
      lastName,
      email: normalizedEmail,
      phone,
      password, // Will be hashed by pre-save hook
      role: ROLES.AGENT,
      parentId: parentAgentId,
      company: req.user.company, // Inherit company name
      isActive: true,
      isVerified: true, // Team members created by verified agents can be auto-verified or handled by admin
    });

    await newMember.save();

    return res.status(201).json({
      success: true,
      message: "Team member added successfully",
      data: newMember,
    });
  } catch (error) {
    console.error("Error adding team member:", error);
    next(new AppError(error.message || "Failed to add team member", 500));
  }
};

/**
 * @desc Remove a team member
 * @route DELETE /api/team/:id
 * @access Private (Agent)
 */
export const removeTeamMember = async (req, res, next) => {
  try {
    const parentAgentId = req.user.id;
    const { id } = req.params;

    const member = await Agent.findOne({ _id: id, parentId: parentAgentId });
    if (!member) {
      return next(new AppError("Team member not found or unauthorized", 404));
    }

    await User.deleteOne({ email: member.email });
    await Agent.deleteOne({ _id: id });

    return res.status(200).json({
      success: true,
      message: "Team member removed successfully",
    });
  } catch (error) {
    console.error("Error removing team member:", error);
    next(new AppError("Failed to remove team member", 500));
  }
};
