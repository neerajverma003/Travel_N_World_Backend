import Agent from "../models/agent.js";
import User from "../models/User.js";
import { AppError } from "../utils/errorHandler.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
import jwt from "jsonwebtoken";
import { ROLES } from "../utils/constant.js";

/**
 * Register agent — used for both self-registration and admin-created agents
 * @param {Object} agentData - { firstName, lastName, email, password, phone, role }
 * @param {Object} currentUser - req.user (optional, if logged in)
 */
export const registerAgent = async (agentData, currentUser = null) => {
  const { firstName, lastName, email, password, phone, role } = agentData;
  const normalizedEmail = typeof email === "string" ? email.toLowerCase().trim() : email;

  // Check if a user already exists for this email
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new AppError("User with this email already exists", 400);
  }

  // Determine role based on hierarchy
  let finalRole = ROLES.AGENT; // default for public registration

  if (currentUser) {
    const creatorRole = currentUser.role;

    if (creatorRole === ROLES.SUPERADMIN) {
      // SuperAdmin can create Admin or Agent
      if (![ROLES.ADMIN, ROLES.AGENT].includes(role)) {
        throw new AppError(
          "SuperAdmin can only create Admin or Agent accounts",
          403
        );
      }
      finalRole = role;
    } else if (creatorRole === ROLES.ADMIN) {
      // Admin can only create Agents
      if (role && role !== ROLES.AGENT) {
        throw new AppError("Admin can only create Agent accounts", 403);
      }
      finalRole = ROLES.AGENT;
    } else {
      throw new AppError("You are not allowed to create agents", 403);
    }
  }

  // Create user credentials
  const user = new User({
    email: normalizedEmail,
    passwordHash: password,
    role: finalRole,
    firstName,
    lastName,
  });
  await user.save();

  // Create agent profile record for all roles so profile endpoints work consistently
  const agentProfile = new Agent({
    firstName,
    lastName,
    email: normalizedEmail,
    phone,
    role: finalRole,
  });
  await agentProfile.save();

  const profileToReturn = agentProfile.toObject();
  delete profileToReturn.password;

  return {
    message: "User registered successfully",
    agent: profileToReturn,
  };
};

/**
 * Agent login
 */
export const loginAgent = async (email, password) => {
  const normalizedEmail = typeof email === "string" ? email.toLowerCase().trim() : email;
  const user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");
  if (!user) throw new AppError("Invalid email or password", 401);

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new AppError("Invalid email or password", 401);

  if (!user.isActive) {
    throw new AppError("Your account is inactive. Contact admin.", 403);
  }

  // get profile if exists
  const agent = await Agent.findOne({ email: normalizedEmail }).select("-password");
  const agentData = agent
    ? agent.toObject()
    : { firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, isActive: user.isActive };

  const payload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
    agent: agentData,
  };
};

/**
 * Refresh tokens
 */
export const refreshAgentTokens = async (oldRefreshToken) => {
  if (!oldRefreshToken) throw new AppError("Refresh token missing", 401);

  let decoded;
  try {
    decoded = jwt.verify(oldRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch (error) {
    throw new AppError("Invalid or expired refresh token", 401);
  }

  // Rotate: delete old token
  // Note: RefreshToken model might need to be imported if used
  // await RefreshToken.deleteOne({ token: oldRefreshToken });

  const user = await User.findById(decoded.id).select("email role isActive");
  if (!user || user.isActive === false) {
    throw new AppError("User no longer valid", 401);
  }

  const payload = { id: user._id.toString(), email: user.email, role: user.role };

  const newAccessToken = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken(payload);

  // await RefreshToken.create({
  //   token: newRefreshToken,
  //   userId: decoded.id,
  //   expiresAt: new Date(Date.now() + 7*24*60*60*1000)
  // });

  return { newAccessToken, newRefreshToken };
};
