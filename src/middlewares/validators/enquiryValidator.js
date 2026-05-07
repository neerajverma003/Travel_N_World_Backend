import { body } from "express-validator";

export const validateCreateEnquiry = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("company_name").trim().notEmpty().withMessage("Company name is required"),
  body("countryCode")
    .optional()
    .isString()
    .trim()
    .matches(/^\+?\d{1,4}$/)
    .withMessage("Invalid country code"),
  body("phone")
    .notEmpty()
    .withMessage("Phone is required")
    .matches(/^\d{7,12}$/)
    .withMessage("Please enter a valid phone number"),
  body("email").isEmail().withMessage("Invalid email format").normalizeEmail(),
  body("location").trim().notEmpty().withMessage("Location is required"),
  body("your_requirements").optional().isString().withMessage("Requirements must be text"),
  body("agree")
    .exists().withMessage("You must agree to the terms to submit")
    .isBoolean().withMessage("Agree must be true or false")
    .toBoolean()
    .custom((value) => value === true)
    .withMessage("You must agree to the terms to submit"),
];
