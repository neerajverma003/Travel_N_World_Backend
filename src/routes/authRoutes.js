import { Router } from "express";
import { login, register, getProfile, updateProfile, verifyOTP, googleLogin} from "../controllers/authController.js";
import { validateRegister, validateLogin } from "../middlewares/validators/authValidator.js";
import { validateRequest } from "../middlewares/validators/validationErrorHandler.js";
import { requireAuth, requireRoles } from "../middlewares/auth.js";
import { ROLES } from "../utils/constant.js";

const router = Router();

// Public auth routes
router.post("/login", validateLogin, validateRequest, login);
router.post("/register", validateRegister, validateRequest, register);
router.post("/verify-otp", verifyOTP);
router.post("/google-login", googleLogin);

// Get logged-in user info
router.get("/me", requireAuth, async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

// Profile endpoints
router.get("/profile", requireAuth, getProfile);
router.put("/profile", requireAuth, updateProfile);

// Logout
router.post("/logout", requireAuth, (req, res) => {
  res.clearCookie("refreshToken", { httpOnly: true, sameSite: "strict" });
  res.status(200).json({ success: true, message: "Logged out successfully" });
});

// Admin routes
router.get(
  "/admin-dashboard",
  requireAuth,
  requireRoles(ROLES.ADMIN, ROLES.SUPERADMIN),
  async (req, res) => {
    res.status(200).json({ success: true, message: "Welcome to admin dashboard" });
  }
);

router.get(
  "/superadmin-only",
  requireAuth,
  requireRoles(ROLES.SUPERADMIN),
  async (req, res) => {
    res.status(200).json({ success: true, message: "Welcome Super Admin" });
  }
);

export default router;
