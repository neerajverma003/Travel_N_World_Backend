import bcrypt from "bcrypt";
import AdminLoginCredential from "../models/adminLoginCredential.js";
import { generateAccessToken } from "../utils/jwt.js";

export const createAdminLoginCredential = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res
        .status(400)
        .json({ message: "Email, password, and role are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await AdminLoginCredential.findOne({ email: normalizedEmail });

    if (existing) {
      return res.status(200).json({
        message: "Admin login credential already exists",
        data: { email: existing.email, role: existing.role },
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const credential = new AdminLoginCredential({
      email: normalizedEmail,
      password: hashedPassword,
      role: role.toUpperCase(),
    });

    await credential.save();

    return res.status(201).json({
      message: "Admin login credential stored",
      data: { email: credential.email, role: credential.role },
    });
  } catch (error) {
    console.error("createAdminLoginCredential error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const loginAdminCredential = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res
        .status(400)
        .json({ message: "Email, password, and role are required" });
    }

    let credential;
    
    if (role.toUpperCase() === "RM") {
      // Check in Agent collection for RM role
      const Agent = (await import("../models/agent.js")).default;
      credential = await Agent.findOne({ 
        email: email.toLowerCase().trim(),
        role: "RM"
      }).select("+password");
    } else {
      // Check in AdminLoginCredential for other admin roles
      credential = await AdminLoginCredential.findOne({
        email: email.toLowerCase().trim(),
      }).select("+password");
    }

    if (!credential) {
      return res.status(401).json({ message: "Invalid credentials or role mismatch" });
    }

    const isMatch = await bcrypt.compare(password, credential.password);
    const roleMatches = credential.role.toLowerCase() === role.toLowerCase();

    if (!isMatch || !roleMatches) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateAccessToken(
      { id: credential._id, email: credential.email, role: credential.role },
      true
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      data: {
        email: credential.email,
        role: credential.role,
      },
    });
  } catch (error) {
    console.error("loginAdminCredential error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const toggleNotifications = async (req, res) => {
  try {
    const admin = await AdminLoginCredential.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    
    admin.notificationsEnabled = !admin.notificationsEnabled;
    await admin.save();
    
    return res.status(200).json({ 
      success: true, 
      message: `Notifications ${admin.notificationsEnabled ? 'enabled' : 'disabled'}`,
      notificationsEnabled: admin.notificationsEnabled
    });
  } catch (error) {
    console.error("toggleNotifications error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role.toUpperCase();

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }

    let credential;
    if (userRole === "RM") {
      const Agent = (await import("../models/agent.js")).default;
      credential = await Agent.findById(userId).select("+password");
    } else {
      credential = await AdminLoginCredential.findById(userId).select("+password");
    }

    if (!credential) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, credential.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid current password" });
    }

    // Hash and save the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    credential.password = hashedPassword;
    await credential.save();

    return res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("changePassword error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};
