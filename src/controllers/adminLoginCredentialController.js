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

    const credential = await AdminLoginCredential.findOne({
      email: email.toLowerCase().trim(),
    }).select("+password");

    if (!credential) {
      return res.status(401).json({ message: "Invalid credentials" });
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
