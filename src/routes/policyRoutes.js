import { Router } from "express";
import { getPolicy, savePolicy } from "../controllers/policyController.js";
import { requireAuth, requireRoles } from "../middlewares/auth.js";
import { ROLES } from "../utils/constant.js";

const router = Router();
router.get("/",getPolicy);
router.post("/",requireAuth,requireRoles(ROLES.SUPERADMIN),savePolicy);
export default router;