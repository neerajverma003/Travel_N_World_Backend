import { ROLES } from "../utils/constant.js";
import { OAuth2Client } from "google-auth-library";
import * as authService from "../services/authService.js";
import * as agentService from "../services/agentService.js";
import Agent from "../models/agent.js";
import User from "../models/User.js";
import { AppError } from "../utils/errorHandler.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import OTP from "../models/otpModel.js";
import sendOTPEmail from "../utils/sendEmail.js";
import { generateAccessToken } from "../utils/jwt.js";
import { signAgent } from "../utils/agentUtils.js";

/**
 * ======================
 * REGISTER CONTROLLER
 * ======================
 */
export const register = async (req, res) => {
  try {
    const {
      first_Name,
      last_Name,
      firstName,
      lastName,
      email,
      password,
      phone_no,
      phone,
    } = req.body;

    const firstNameValue = (first_Name || firstName || "").trim();
    const lastNameValue = (last_Name || lastName || "").trim();
    const phoneValue = (phone_no || phone || "").trim();
    const emailValue = (email || "").toLowerCase().trim();

    if (!firstNameValue || !lastNameValue || !emailValue || !password || !phoneValue) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const emailDuplicate = await Agent.findOne({ email: emailValue });
    if (emailDuplicate) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const phoneDuplicate = await Agent.findOne({ phone: phoneValue });
    if (phoneDuplicate) {
      return res.status(400).json({ message: "Phone number already exists" });
    }

    const hashPass = await bcrypt.hash(password, 10);
    const adminObj = {
      firstName: firstNameValue,
      lastName: lastNameValue,
      email: emailValue,
      password: hashPass,
      phone: phoneValue,
    };
    const admin = new Agent(adminObj);
    await admin.save();
    if (admin) {
      return res.status(200).json({ message:  'agent  Successfully Created' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

/**
 * ======================
 * LOGIN CONTROLLER
 * ======================
 */
export const login = async (req, res) => {
  console.log("Response sent to frontend")
  try {
    const { email, password, rememberMe, loginMode } = req.body;
    const normalizedEmail = email?.toLowerCase().trim();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const admin = await Agent.findOne({ email: normalizedEmail }).select("+password");
    if (!admin) {
      return res.status(400).json({ message: "Invalid details entered" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid details entered" });
    }

    if (loginMode === "superadmin") {
      if (admin.role !== ROLES.SUPERADMIN) {
        return res.status(403).json({ message: "Not a SuperAdmin account" });
      }

      const accessToken = generateAccessToken({
        id: admin._id, email: admin.email, role: admin.role,
      },
        rememberMe
      );

      return res.json({
        success: true,
        accessToken,
        user: { _id: admin._id, email: admin.email, role: admin.role, isProfileComplete: true, },
      });
    }
    
    // 1. Generate a 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Save OTP to MongoDB
    await OTP.create({ email: admin.email, otp: generatedOtp });

    // 3. Send OTP via email
    sendOTPEmail(admin.email, generatedOtp); 

    // 4. Tell Frontend to switch to OTP UI
    return res.json({ otpSent: true, message: "OTP sent to your email" });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// --- LOGIN STEP 2: VERIFY OTP ---
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp, rememberMe } = req.body;
    const normalizedEmail = email?.toLowerCase().trim();

    // 1. Find the OTP in MongoDB
    const otpRecord = await OTP.findOne({ email: normalizedEmail, otp });

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // 2. Get User for Token
    const admin = await Agent.findOne({ email: normalizedEmail });

    if (!admin) return res.status(404).json({ message: "User no longer exists" });
    
    // 3. Generate the actual Access Token
    const accessToken = generateAccessToken(
      {
        id: admin._id,
        email: admin.email,
        role: admin.role,
      },
      rememberMe
    );

    // 4. Clean up: Delete OTP after use
    await OTP.deleteOne({ _id: otpRecord._id });

    return res.json({
      accessToken,
      success: true,
      user: {
        _id: admin._id,
        email: admin.email,
        role: admin.role,
        firstName: admin.firstName,
        lastName: admin.lastName,
        phone: admin.phone,
        photo: admin.photo,
        isVerified: admin.isVerified ?? false,
        isProfileComplete: admin.isProfileComplete ?? false,
      },
    });

  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getProfile = async (req, res) => {
  try {
    const agent = await Agent.findById(req.user.id)
      .select("-password")
      .populate("relationshipManagerId", "firstName lastName email phone photo");
    if (!agent) {
      return res.status(404).json({ message: "Profile not found" });
    }
    const signedAgent = await signAgent(agent);
    return res.status(200).json({ user: signedAgent });
  } catch (error) {
    console.error("getProfile error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    // We delegate the update logic to agentService to keep it consistent with the Admin panel
    const result = await agentService.updateAgent(req.user.id, req.body, req.user);
    
    // Sign the updated agent profile before returning
    const signedAgent = await signAgent(result.agent);
    
    return res.status(200).json({ 
      message: result.message || "Profile updated", 
      user: signedAgent 
    });
  } catch (error) {
    console.error("updateProfile error:", error);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({ message: error.message || "Server Error" });
  }
};


const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: "Token is required" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email, given_name, family_name, picture } = ticket.getPayload();
    const normalizedEmail = email.toLowerCase().trim();

    let agent = await Agent.findOne({ email: normalizedEmail });

    if (!agent) {
      // Create new agent if not found
      agent = new Agent({
        firstName: given_name || "",
        lastName: family_name || "",
        email: normalizedEmail,
        role: ROLES.AGENT,
        isActive: true,
        isVerified: false,
        photo: picture || "",
      });
      await agent.save();
    }

    const accessToken = generateAccessToken({
      id: agent._id,
      email: agent.email,
      role: agent.role,
    }, true); // Remember me true for Google login

    return res.status(200).json({
      success: true,
      accessToken,
      user: {
        _id: agent._id,
        email: agent.email,
        role: agent.role,
        firstName: agent.firstName,
        lastName: agent.lastName,
        phone: agent.phone,
        photo: agent.photo,
        isVerified: agent.isVerified ?? false,
        isProfileComplete: agent.isProfileComplete ?? false,
      },
    });
  } catch (error) {
    console.error("Google Login Error:", error);
    res.status(400).json({ message: "Invalid Google Token or Server Error" });
  }
};
