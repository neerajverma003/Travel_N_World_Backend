/**
 * Transport Route Routes
 * Base path: /api/transport-routes
 */

import { Router } from "express";
import {
  listTransportRoutes,
  getTransportRouteBySlug,
  adminListTransportRoutes,
  createTransportRoute,
  updateTransportRoute,
  deleteTransportRoute,
} from "../controllers/transportRouteController.js";
import { requireAuth, requireRoles } from "../middlewares/auth.js";
import { ROLES } from "../utils/constant.js";

const router = Router();

/* ── Public ─────────────────────────────────────────────── */
router.get("/",       listTransportRoutes);
router.get("/:slug",  getTransportRouteBySlug);

/* ── Admin / SuperAdmin / RM ── */
router.get(
  "/admin/all",
  requireAuth,
  requireRoles(ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.AGENT, ROLES.RM),
  adminListTransportRoutes
);

router.post(
  "/",
  requireAuth,
  requireRoles(ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.AGENT, ROLES.RM),
  createTransportRoute
);

router.put(
  "/:slug",
  requireAuth,
  requireRoles(ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.AGENT, ROLES.RM),
  updateTransportRoute
);

router.delete(
  "/:slug",
  requireAuth,
  requireRoles(ROLES.ADMIN, ROLES.SUPERADMIN, ROLES.AGENT, ROLES.RM),
  deleteTransportRoute
);

export default router;
