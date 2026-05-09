import { body } from "express-validator";

export const validateDestination = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Destination name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),

  body("type")
    .trim()
    .notEmpty()
    .withMessage("Destination type is required")
    .toLowerCase()
    .isIn(["domestic", "international"])
    .withMessage("Type must be either 'domestic' or 'international'"),
  
  body("shortDescription")
    .trim()
    .notEmpty()
    .withMessage("Short description is required")
    .isLength({ min: 10 })
    .withMessage("Short description must be at least 10 characters long"),
];

