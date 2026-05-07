import { Router } from "express";
import { 
  createContactInquiry, 
  getContactInquiries, 
  deleteContactInquiry 
} from "../controllers/contactController.js";
import { requireAuth, requireRoles } from "../middlewares/auth.js";
import { ROLES } from "../utils/constant.js";

import { validateContact } from "../middlewares/validators/contactValidator.js";
import { validateRequest } from "../middlewares/validators/validationErrorHandler.js";

const router = Router();

// Public route to submit contact form
router.post("/", validateContact, validateRequest, createContactInquiry);

// Admin routes to manage inquiries
router.get("/", requireAuth, requireRoles(ROLES.ADMIN, ROLES.SUPERADMIN), getContactInquiries);
router.delete("/:id", requireAuth, requireRoles(ROLES.ADMIN, ROLES.SUPERADMIN), deleteContactInquiry);

export default router;
