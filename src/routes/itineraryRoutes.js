/**
 * Itinerary Routes
 *
 * Base path: /api/itineraries
 *
 * PUBLIC  (no auth required):
 *   GET  /                              List / filter itineraries
 *                                       ?type=domestic|international
 *                                       ?destination=goa
 *                                       ?classification=Trending
 *                                       ?limit=12&skip=0
 *   GET  /:slug                         Full detail for a single itinerary
 *
 * PROTECTED  (ADMIN | SUPERADMIN only):
 *   POST   /                            Create itinerary (AddItineraries form)
 *   PUT    /:slug                       Update itinerary
 *   DELETE /:slug                       Delete itinerary
 */

import { Router } from "express";
import {
  createItinerary,
  listItineraries,
  getBySlug,
  updateItinerary,
  deleteItinerary,
} from "../controllers/itineraryController.js";
import { requireAuth, requireRoles } from "../middlewares/auth.js";
import { ROLES } from "../utils/constant.js";

const router = Router();

/* ── Public routes ─────────────────────────────────────────────────────── */
router.get("/",      listItineraries); // filtered listing
router.get("/:slug", getBySlug);       // single full detail

/* ── Protected routes ─────────────────────────────────────────────────── */
router.post(
  "/",
  requireAuth,
  requireRoles(ROLES.ADMIN, ROLES.SUPERADMIN),
  createItinerary
);

router.put(
  "/:slug",
  requireAuth,
  requireRoles(ROLES.ADMIN, ROLES.SUPERADMIN),
  updateItinerary
);

router.delete(
  "/:slug",
  requireAuth,
  requireRoles(ROLES.ADMIN, ROLES.SUPERADMIN),
  deleteItinerary
);

export default router;
