import mongoose from "mongoose";

const adminSettingsSchema = new mongoose.Schema(
  {
    type: { 
      type: String, 
      enum: ["profile", "banner"], 
      required: true,
      unique: true 
    },
    // For profile
    adminName: String,
    role: String,
    // For banner & profile photo
    imageUrl: String,
    imagePublicId: String,
  },
  { timestamps: true }
);

const AdminSettings = mongoose.model("AdminSettings", adminSettingsSchema);
export default AdminSettings;
