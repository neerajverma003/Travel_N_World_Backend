import { Router } from "express";
import { createBlog, getAllBlogs, getBlogBySlug, getBlogById, updateBlog, deleteBlog } from "../controllers/blogController.js";
import { requireAuth, requireRoles } from "../middlewares/auth.js";
import { ROLES } from "../utils/constant.js";

import { validateBlog } from "../middlewares/validators/blogValidator.js";
import { validateRequest } from "../middlewares/validators/validationErrorHandler.js";

const router = Router();

router.post("/", requireAuth, requireRoles(ROLES.SUPERADMIN), validateBlog, validateRequest, createBlog); // Only Admin
router.put("/:id", requireAuth, requireRoles(ROLES.SUPERADMIN), validateBlog, validateRequest, updateBlog); // Only Admin
router.get("/", getAllBlogs); // Public
router.get("/:slug", getBlogBySlug); // Public
router.get("/id/:id", getBlogById); // Admin/Private fetch by ID
router.delete("/:id", requireAuth, requireRoles(ROLES.SUPERADMIN), deleteBlog); // Only Admin

export default router;
