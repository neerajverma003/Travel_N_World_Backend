import { body } from "express-validator";

export const validateBlog = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Blog title is required")
    .isLength({ min: 5, max: 100 })
    .withMessage("Title must be between 5 and 100 characters"),
  
  body("content")
    .trim()
    .notEmpty()
    .withMessage("Blog content is required")
    .isLength({ min: 20 })
    .withMessage("Content must be at least 20 characters long"),
  
  body("category")
    .optional()
    .trim()
    .isString(),
  
  body("tags")
    .optional()
    .isArray()
    .withMessage("Tags must be an array"),
];
