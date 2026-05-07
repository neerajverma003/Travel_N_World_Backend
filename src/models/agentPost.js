import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      // required: true,
    },
    companyName: {
      type: String,
      required: true,
    },
    location: {
      type: Date,
      required: true,
    },
    rating: {
      type: String,
      required: true,
    //   enum: ["Male", "Female", "Other"],
    },
    email: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Student = mongoose.model("Student", studentSchema);
export default Student;