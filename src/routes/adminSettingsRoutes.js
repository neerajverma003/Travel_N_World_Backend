import { Router } from "express";
import AdminSettings from "../models/AdminSettings.js";
import { requireAuth, requireRoles } from "../middlewares/auth.js";
import { ROLES } from "../utils/constant.js";

const router = Router();

// GET global profile
router.get("/profile", async (req, res) => {
  try {
    const settings = await AdminSettings.findOne({ type: "profile" });
    res.status(200).json({
      success: true,
      data: settings || { adminName: "Super Admin", role: "Master Administrator", imageUrl: "" }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET dashboard banner
router.get("/banner", async (req, res) => {
  try {
    const settings = await AdminSettings.findOne({ type: "banner" });
    res.status(200).json({
      success: true,
      data: settings || { imageUrl: "" }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// UPDATE settings (Admin/Superadmin only)
router.put("/:type", requireAuth, requireRoles(ROLES.ADMIN, ROLES.SUPERADMIN), async (req, res) => {
  try {
    const { type } = req.params;
    if (!["profile", "banner"].includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid settings type" });
    }

    const settings = await AdminSettings.findOneAndUpdate(
      { type },
      { $set: { ...req.body, type } },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: `${type} updated successfully`,
      data: settings
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
