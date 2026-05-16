import { Router } from "express";
import { getTeamMembers, addTeamMember, removeTeamMember } from "../controllers/teamController.js";
import { requireAuth, requireRoles } from "../middlewares/auth.js";
import { ROLES } from "../utils/constant.js";

const router = Router();

router.use(requireAuth);
router.use(requireRoles(ROLES.AGENT));

router.get("/", getTeamMembers);
router.post("/", addTeamMember);
router.delete("/:id", removeTeamMember);

export default router;
