import mongoose from "mongoose";
import bcrypt from "bcrypt";
const customerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        lowercase: true,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
    },
    profileImage: {
        type: String,
        default: ""
    },
    Phone: {
        type: String,
        required: true
    },
    basicInfo: {
        type: String,
        default: ""
    }
}, {
    timestamps: true
})


// Before saving the  password hash it 
customerSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next()
    }
    catch (error) {
        next(error)
    }
})

// at the login time to check password  match 
customerSchema.methods.comparePassword = async function (condidatePassword){
   return await bcrypt.compare(condidatePassword, this.password);
}

export default mongoose.model("Customer",customerSchema);