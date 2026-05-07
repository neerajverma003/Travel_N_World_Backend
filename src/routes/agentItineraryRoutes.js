/**
 * Agent Itinerary Routes
 * 
 * Base path: /api/agent-itineraries
 */

import { Router } from "express";
import {
  createAgentItinerary,
  listAgentItineraries,
  getAgentItineraryBySlug,
  updateAgentItinerary,
  deleteAgentItinerary,
} from "../controllers/agentItineraryController.js";
import { requireAuth, requireRoles } from "../middlewares/auth.js";
import { ROLES } from "../utils/constant.js";
import jwt from "jsonwebtoken";

const tryAuth = (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : (authHeader.startsWith("bearer ") ? authHeader.slice(7) : null);
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      req.user = { id: payload.id, email: payload.email, role: payload.role };
    } catch (e) {}
  }
  next();
};

const router = Router();

/* ── Public (Filtered by Agent if provided, or by role if authenticated) ── */
router.get("/", tryAuth, listAgentItineraries); // Can filter by ?agentId=...
router.get("/:slug", getAgentItineraryBySlug);

/* ── Protected (Admin, Superadmin, Agent) ── */
router.post(
  "/",
  requireAuth,
  requireRoles(ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.AGENT),
  createAgentItinerary
);

router.put(
  "/:slug",
  requireAuth,
  requireRoles(ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.AGENT),
  updateAgentItinerary
);

router.delete(
  "/:slug",
  requireAuth,
  requireRoles(ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.AGENT),
  deleteAgentItinerary
);

export default router;
