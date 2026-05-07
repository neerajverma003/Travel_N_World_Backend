import mongoose from "mongoose";

const policySchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ["terms", "payment", "cancellation", "privacy"],
    required: true 
  },
  category: { 
    type: String, 
    enum: ["Domestic", "International", "General"], 
    default: "General" 
  },
  destination: { 
    type: String, 
    default: "General" // 'Andaman' etc for terms, 'General' for others
  },
  content: { 
    type: String, 
    required: true 
  }
});

// Taaki ek type, category aur destination ki sirf EK hi entry ho
policySchema.index({ type: 1, category: 1, destination: 1 }, { unique: true });


const Policy = mongoose.model("Policy", policySchema);
export default Policy;
