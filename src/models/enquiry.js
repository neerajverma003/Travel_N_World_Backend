import mongoose from "mongoose";

const { Schema } = mongoose;

const enquirySchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    company_name: {
      type: String,
      required: false,
      trim: true,
      default: "Customer Lead"
    },

    countryCode: {
      type: String,
      required: true,
      default: "+91",
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      match: [/^\d{7,15}$/, "Please enter a valid phone number"],
    },

    email: {
      type: String,
      required: false, // Made optional to match frontend logic
      trim: true,
      lowercase: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    fromCity: {
      type: String,
      trim: true,
    },

    your_requirements: {
      type: String,
      trim: true,
      default: "",
    },

    /* ── Travel Details ── */
    travelDate: Date,
    travelDuration: { type: Number, default: 4 },
    adults: { type: Number, default: 1 },
    children: { type: Number, default: 0 },
    infants: { type: Number, default: 0 },
    rooms: { type: Number, default: 1 },
    budget: { type: Number, default: 0 },
    hotelCategory: { type: String, default: "Standard" },
    tripCategory: { type: String, default: "family" },
    travelWith: { type: String, default: "Spouse" },
    
    ticketBooked: { type: String, default: "No" },
    ticketRequired: { type: String, default: "No" },
    transportMode: { type: String, default: "Select Transport" },
    ticketCategory: { type: String, default: "Select Ticket Category" },
    bookingTimeline: { type: String, default: "Just Exploring" },

    /* ── Step 3 Personal Profile ── */
    dob: Date,
    gender: String,
    maritalStatus: String,
    monthlyIncome: String,
    nationality: { type: String, default: "India" },

    status: {
      type: String,
      enum: ["New", "Hot", "Follow-up", "Booked"],
      default: "New"
    },
    source: { type: String, default: "Premium Portal Lead" },

    /* ── Reference to Agent & Itinerary ───────────────────────────────── */
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      required: false,
    },
    itineraryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AgentItinerary",
      required: false,
    },
    itineraryTitle: {
      type: String,
      trim: true,
    },

    destination:{
      type:String,
      required:false
    },
    destinationType:{
      type:String,
      required:false
    },
    days:{
     type:String,
     required:false
    },
    purpose:{
      type:String,
      required:false
    },
    consultation:{
     type:String,
     default:""
    },
    budgetRange: { 
      type: String, 
      required: false 
    },
    agree: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Enquiry = mongoose.model("Enquiry", enquirySchema);
