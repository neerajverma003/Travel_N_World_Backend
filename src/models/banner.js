import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    desc: { type: String, default: "" },
    startDate: { type: Date },
    endDate: { type: Date },
    imageUrl: { type: String, required: true },
    link: { type: String, default: "" },
    position: {
      type: String,
      enum: ["top", "middle"],
      required: true,
    },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Banner = mongoose.model("Banner", bannerSchema);

export default Banner;