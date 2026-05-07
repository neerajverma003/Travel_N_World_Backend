import { Router } from "express";
import { createAdminLoginCredential, loginAdminCredential,} from "../controllers/adminLoginCredentialController.js";

const router = Router();

router.post("/", createAdminLoginCredential);
router.post("/login", loginAdminCredential);

export default router;
