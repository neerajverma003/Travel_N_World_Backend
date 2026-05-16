import { body } from "express-validator";

export const validateCreateEnquiry = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("company_name").optional().trim(),
  body("countryCode")
    .optional()
    .isString()
    .trim()
    .matches(/^\+?\d{1,4}$/)
    .withMessage("Invalid country code"),
  body("phone")
    .notEmpty()
    .withMessage("Phone is required")
    .matches(/^\d{7,15}$/)
    .withMessage("Please enter a valid phone number"),
  body("email")
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage("Invalid email format")
    .normalizeEmail(),
  body("location").trim().notEmpty().withMessage("Location is required"),
  body("your_requirements").optional().isString().withMessage("Requirements must be text"),
  body("agree")
    .optional()
    .toBoolean()
];
