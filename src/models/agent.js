// models/Agent.js
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { ROLES } from "../utils/constant.js";

const { Schema } = mongoose;
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || "10", 10);

const addressSchema = new Schema(
  {
    houseNo: String ,
    street: String,
    area: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
  },
  { _id: false }
);

const agentSchema = new Schema(
  {
    // Basic Info
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    email: { type: String, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    phone: { type: String },
    whatsapp: String,
    // Relationship Manager link
    relationshipManagerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    default: null
    },


    // Auth & Status
    role: { type: String, enum: Object.values(ROLES), default: ROLES.AGENT },
    agentCategory: { type: String, enum: ["Travel", "Transport", "Hotel"], default: "Travel" },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },

    // Admin approval status
    verificationStartDate:{type:Date,default:null},
    verificationEndDate:{type:Date,default:null},


    // Team Hierarchy
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      default: null
    },

    // Company Info
    company: { type: String, trim: true },
    registeredEmail: String,
    secondaryEmails: [String],
    companyAddress: { type: addressSchema },
    branchAddresses: [addressSchema],
    testimonials: [
      {
        name: String,
        text: String,
        rating: { type: Number, default: 5 },
        image: String,
        profile: String,
        time: String,
        date: String
      }
    ],
    website: String,

    // Profile Content
    photo: String, // Main profile picture (Agent Photo)
    logo: String, // Company Logo
    bannerImage: [String], // Background banner images (carousel)
    agentPhotos: [String], // Gallery images
    agentVideos: [String], // Gallery videos
    overview: { type: String, default: "" },
    services: { type: [String], default: [] }, // List of services provided
    tags: { type: [String], default: [] }, // Key highlights/tags

    // Dynamic Data
    tourPackages: { type: String, default: "" },
    quickInfo: { type: String, default: "" },
    reviews: { type: String, default: "" },
    rating: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },

    // Metadata
    profileCompletedAt: Date,
    blogs: [
      {
        title: { type: String, default: "" },
        image: { type: String, default: "" },
        content: { type: String, default: "" },
        link: { type: String, default: "" },
        isPublished: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    reviewsList: [
      {
        name: String,
        rating: { type: Number, default: 5 },
        comment: String,
        date: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  },
  
);

// Virtual for profile completeness
agentSchema.virtual("isProfileComplete").get(function () {
  return !!(
    this.firstName &&
    this.lastName &&
    this.phone &&
    this.company &&
    this.companyAddress?.city &&
    this.companyAddress?.postalCode
  );
});



// Pre-save hook to hash password and sync emails
agentSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const looksHashed = typeof this.password === "string" && /^\$2[aby]\$\d{2}\$/.test(this.password);
    if (!looksHashed) {
      this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
    }
  }

  // Generate slug if not present
  if (!this.slug && (this.firstName || this.company)) {
    const base = this.company || `${this.firstName} ${this.lastName}`;
    this.slug = base
      .toLowerCase()
      .replace(/[^\w ]+/g, "")
      .replace(/ +/g, "-") + "-" + Math.random().toString(36).substring(2, 7);
  }

  if (!this.registeredEmail) this.registeredEmail = this.email;
  if (this.isProfileComplete && !this.profileCompletedAt) this.profileCompletedAt = new Date();
  next();
});

// Instance method to compare password
agentSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Clean JSON output - removing password
agentSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.password;
    return ret;
  },
});

// Static helper to hash passwords
agentSchema.statics.hashPassword = async function (password) {
  return bcrypt.hash(password, SALT_ROUNDS);
};

const Agent = mongoose.models.Agent || mongoose.model("Agent", agentSchema);
export default Agent;
