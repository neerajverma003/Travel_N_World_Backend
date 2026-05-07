import { body } from "express-validator";
import { ROLES } from "../../utils/constant.js";

export const validateRegister = [
  body("email")
    .trim()
    .isEmail().withMessage("Please provide a valid email")
    .normalizeEmail(),
  body("first_Name")
    .trim()
    .notEmpty().withMessage("First name is required")
    .matches(/^[a-zA-Z\s]+$/).withMessage("First name cannot contain numbers"),
  body("last_Name")
    .trim()
    .notEmpty().withMessage("Last name is required")
    .matches(/^[a-zA-Z\s]+$/).withMessage("Last name cannot contain numbers"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("phone_no")
    .trim()
    .notEmpty().withMessage("Phone number is required")
    .matches(/^\d{10,15}$/)
    .withMessage("Please provide a valid 10-15 digit phone number"),
  body("role")
    .optional()
    .isIn(Object.values(ROLES))
    .withMessage("Invalid role"),
];

export const validateLogin = [
  body("email")
    .trim()
    .isEmail().withMessage("Please provide a valid email")
    .normalizeEmail(),
  body("password")
    .notEmpty().withMessage("Password is required"),
];

