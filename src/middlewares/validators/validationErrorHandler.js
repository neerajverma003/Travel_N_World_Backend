import { AppError } from "../../utils/errorHandler.js";
import { validationResult } from "express-validator";

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors.array().map(err => err.msg).join(", ");
    return next(new AppError(message, 400));
  }
  next();
};