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

/* ── Admin / SuperAdmin ─────────────────────────────────── */
router.get(
  "/admin/all",
  requireAuth,
  requireRoles(ROLES.ADMIN, ROLES.SUPERADMIN),
  adminListTransportRoutes
);

router.post(
  "/",
  requireAuth,
  requireRoles(ROLES.ADMIN, ROLES.SUPERADMIN),
  createTransportRoute
);

router.put(
  "/:slug",
  requireAuth,
  requireRoles(ROLES.ADMIN, ROLES.SUPERADMIN),
  updateTransportRoute
);

router.delete(
  "/:slug",
  requireAuth,
  requireRoles(ROLES.ADMIN, ROLES.SUPERADMIN),
  deleteTransportRoute
);

export default router;
