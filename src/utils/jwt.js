import jwt from "jsonwebtoken";
import crypto from "crypto";
import { AppError } from "./errorHandler.js";

export const generateAccessToken = (payload, rememberMe = false) => {
  const accessJti = crypto.randomBytes(16).toString("hex");
  const secret = process.env.ACCESS_TOKEN_SECRET;
  
  if (!secret) throw new AppError("ACCESS_TOKEN_SECRET not set", 500);

  return jwt.sign({ ...payload, jti: accessJti }, secret, { expiresIn: rememberMe ? "7d" : "1d" });
};

export const generateRefreshToken = (payload) => {
  const refreshJti = crypto.randomBytes(16).toString("hex");
  const secret = process.env.REFRESH_TOKEN_SECRET;
  if (!secret) throw new AppError("REFRESH_TOKEN_SECRET not set", 500);

  return jwt.sign({ ...payload, jti: refreshJti }, secret, { expiresIn: "7d" });
};
