import { Router } from "express";
import { createEnquiry, getAllEnquiries, deleteEnquiry, getAgentEnquiries, getBuyableLeads, updateEnquiryStatus } from "../controllers/enquiryController.js";
import { requireAuth, requireRoles } from "../middlewares/auth.js";
import { validateRequest } from "../middlewares/validators/validationErrorHandler.js";
import { validateCreateEnquiry } from "../middlewares/validators/enquiryValidator.js";
import { ROLES } from "../utils/constant.js";

const router = Router();

router.post("/", validateCreateEnquiry, validateRequest, createEnquiry);

router.get("/", requireAuth, requireRoles(ROLES.ADMIN, ROLES.SUPERADMIN), getAllEnquiries);
router.get("/my-leads", requireAuth, requireRoles(ROLES.AGENT), getAgentEnquiries);
router.get("/buy-leads", requireAuth, requireRoles(ROLES.AGENT), getBuyableLeads);
router.patch("/:id/status", requireAuth, requireRoles(ROLES.AGENT, ROLES.ADMIN, ROLES.SUPERADMIN), updateEnquiryStatus);
router.delete("/:id", requireAuth, requireRoles(ROLES.ADMIN, ROLES.SUPERADMIN), deleteEnquiry);

export default router;
