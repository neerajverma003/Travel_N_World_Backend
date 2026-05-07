import mongoose from "mongoose";

const { Schema } = mongoose;

const agentReviewSchema = new Schema(
  {
    agentId: {
      type: Schema.Types.ObjectId,
      ref: "Agent",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    userName: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    tags: [String], // e.g. ["Good service", "Quick response"]
    images: [String], // S3 keys for review images
  },
  { timestamps: true }
);

// After saving a review, update the agent's average rating and count
agentReviewSchema.post("save", async function () {
  const Agent = mongoose.model("Agent");
  const stats = await mongoose.model("AgentReview").aggregate([
    { $match: { agentId: this.agentId } },
    {
      $group: {
        _id: "$agentId",
        avgRating: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Agent.findByIdAndUpdate(this.agentId, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      reviewsCount: stats[0].count,
    });
  }
});

const AgentReview = mongoose.models.AgentReview || mongoose.model("AgentReview", agentReviewSchema);
export default AgentReview;
