import mongoose from "mongoose";
import bcrypt from "bcrypt";

const { Schema } = mongoose;
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || "10", 10);

const adminLoginCredentialSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      required: true,
      default: "SUPERADMIN",
    },
  },
  {
    timestamps: true,
    collection: "adminslogincredentials",
  }
);

adminLoginCredentialSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const looksHashed = typeof this.password === "string" && /^\$2[aby]\$\d{2}\$/.test(this.password);
    if (!looksHashed) {
      this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
    }
  }
  next();
});

adminLoginCredentialSchema.set("toJSON", {
  transform(doc, ret) {
    delete ret.password;
    return ret;
  },
});

const AdminLoginCredential =
  mongoose.models.AdminLoginCredential ||
  mongoose.model("AdminLoginCredential", adminLoginCredentialSchema);

export default AdminLoginCredential;
