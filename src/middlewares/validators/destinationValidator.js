import { body } from "express-validator";

export const validateDestination = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Destination name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 10 })
    .withMessage("Description must be at least 10 characters long"),
  
  body("location")
    .trim()
    .notEmpty()
    .withMessage("Location is required"),
];
