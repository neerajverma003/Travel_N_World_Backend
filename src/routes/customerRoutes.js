import express from "express";
import { registerCustomer, loginCustomer, updateCustomerProfile, getAllCustomers } from "../controllers/customerAuthController.js";
const router = express.Router();

router.post("/register", registerCustomer);
router.post("/login", loginCustomer);
router.put("/profile", updateCustomerProfile);
router.get("/list", getAllCustomers);

export default router;