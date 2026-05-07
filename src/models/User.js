import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { ROLES } from "../utils/constant.js";

const { Schema } = mongoose;
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || "10", 10);

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/, "Invalid email address"],
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: Object.values(ROLES), required: true, index: true },
    isActive: { type: Boolean, default: true },
    firstName: { type: String },
    lastName: { type: String },
    isProfileComplete: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("passwordHash")) return next();
  const looksHashed = typeof this.passwordHash === "string" && /^\$2[aby]\$\d{2}\$/.test(this.passwordHash);
  if (!looksHashed) {
    this.passwordHash = await bcrypt.hash(this.passwordHash, SALT_ROUNDS);
  }
  next();
});

userSchema.methods.comparePassword = async function (password) {
  if (!password || !this.passwordHash) return false;
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.statics.hashPassword = async function (password) {
  return bcrypt.hash(password, SALT_ROUNDS);
};

const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
