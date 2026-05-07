import express from "express";
import { createBanner, getBanners, updateBanner, deleteBanner, toggleBannerStatus } from "../controllers/bannerController.js";

import { requireAuth, requireRoles } from "../middlewares/auth.js";
import { ROLES } from "../utils/constant.js";

const router = express.Router();

// PUBLIC
router.get("/", getBanners);

// ADMIN
router.post("/", requireAuth, requireRoles(ROLES.ADMIN), createBanner);

router.put("/:id", requireAuth, requireRoles(ROLES.ADMIN), updateBanner);

router.delete("/:id", requireAuth, requireRoles(ROLES.ADMIN), deleteBanner);

router.patch("/:id/toggle", requireAuth, requireRoles(ROLES.ADMIN), toggleBannerStatus);

export default router;