import { Router } from "express";
import {
  getAllAgents,
  getAgentById,
  createAgent,
  updateAgent,
  deleteAgent,
  toggleAgentStatus,
  getVerifiedAgents,
  getPublicAgents,
  submitReview,
  addPublicPhoto,
  getAllReviews,
  updateReview,
  deleteReview,
} from "../controllers/agentController.js";
import { requireAuth, requireRoles } from "../middlewares/auth.js";
import { ROLES } from "../utils/constant.js";
import { check, body } from "express-validator";
import { validateRequest } from "../middlewares/validators/validationErrorHandler.js";

const router = Router();

// ==================== VALIDATIONS ====================

const validateAgent = [
  check("firstName", "First name is required").notEmpty().trim(),
  check("lastName", "Last name is required").notEmpty().trim(),
  check("company", "Company name is required").notEmpty().trim(),
  check("email", "Valid email is required").isEmail().normalizeEmail(),
  check("phone", "Valid phone number is required").notEmpty(),
  validateRequest,
];

const validateReview = [
  body("rating", "Rating must be between 1 and 5").isInt({ min: 1, max: 5 }),
  body("comment", "Comment is required").notEmpty().trim(),
  validateRequest,
];

// ==================== PUBLIC ROUTES ====================

// Get verified agents for homepage slider
router.get("/verified", getVerifiedAgents);

// Get all active agents for public list
router.get("/public", getPublicAgents);

// Get single agent profile for details page
router.get("/public/:agentId", getAgentById);


// ==================== PROTECTED ROUTES (USER) ====================

// Submit a review for an agent (Public)
router.post("/:agentId/reviews", validateReview, submitReview);

// ==================== ADMIN ROUTES (ADMIN/SUPERADMIN) ====================

// Get all agents (with pagination/search)
router.get("/", requireAuth, requireRoles(ROLES.ADMIN, ROLES.SUPERADMIN), getAllAgents);

// Get specific agent (Admin view)
router.get("/:agentId", requireAuth, requireRoles(ROLES.ADMIN, ROLES.SUPERADMIN), getAgentById);

// Create new agent
router.post("/", requireAuth, requireRoles(ROLES.ADMIN, ROLES.SUPERADMIN), validateAgent, createAgent);

// Update agent
router.put("/:agentId", requireAuth, requireRoles(ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.AGENT), updateAgent);

// Delete agent
router.delete("/:agentId", requireAuth, requireRoles(ROLES.ADMIN, ROLES.SUPERADMIN), deleteAgent);

// Toggle agent status (Active/Inactive)
router.patch("/:agentId/status", requireAuth, requireRoles(ROLES.ADMIN, ROLES.SUPERADMIN), toggleAgentStatus);

// ==================== REVIEW MANAGEMENT (SUPERADMIN & AGENT) ====================

// Get all reviews (SuperAdmin sees all, Agent sees only theirs)
router.get("/all/reviews", requireAuth, requireRoles(ROLES.SUPERADMIN, ROLES.AGENT), getAllReviews);

// Update a specific review
router.put("/reviews/:reviewId", requireAuth, requireRoles(ROLES.SUPERADMIN, ROLES.AGENT), updateReview);

// Delete a specific review
router.delete("/reviews/:reviewId", requireAuth, requireRoles(ROLES.SUPERADMIN, ROLES.AGENT), deleteReview);

export default router;
