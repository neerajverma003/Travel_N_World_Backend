import { Router } from "express";
import {
  createDestination,
  listDestinations,
  getDestinationBySlug,
  getDestinationById,
  getDestinationCards,
  updateDestination,
  deleteDestination,
  getDestinationsByType,
} from "../controllers/destinationController.js";
import { requireAuth, requireRoles } from "../middlewares/auth.js";
import { ROLES } from "../utils/constant.js";

import { validateDestination } from "../middlewares/validators/destinationValidator.js";
import { validateRequest } from "../middlewares/validators/validationErrorHandler.js";

const router = Router();

// Public routes
router.get("/cards", getDestinationCards);
router.get("/type/:type", getDestinationsByType);
router.get("/slug/:slug", getDestinationBySlug);
router.get("/:id", getDestinationById);
router.get("/", listDestinations);

// Admin routes
router.post(
  "/",
  requireAuth,
  requireRoles(ROLES.ADMIN, ROLES.SUPERADMIN),
  validateDestination,
  validateRequest,
  createDestination
);

router.put(
  "/:id",
  requireAuth,
  requireRoles(ROLES.ADMIN, ROLES.SUPERADMIN),
  validateDestination,
  validateRequest,
  updateDestination
);

router.delete(
  "/:id",
  requireAuth,
  requireRoles(ROLES.ADMIN, ROLES.SUPERADMIN),
  deleteDestination
);

export default router;
