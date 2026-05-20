import { Router } from "express";
import { createAdminLoginCredential, loginAdminCredential, toggleNotifications, changePassword } from "../controllers/adminLoginCredentialController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.post("/", createAdminLoginCredential);
router.post("/login", loginAdminCredential);
router.patch("/toggle-notifications", requireAuth, toggleNotifications);
router.patch("/change-password", requireAuth, changePassword);

export default router;
