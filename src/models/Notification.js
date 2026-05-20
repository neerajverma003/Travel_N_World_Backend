import mongoose from "mongoose";

const {Schema} = mongoose

const notificationSchema = new Schema({
    
        recipient:{
           type:mongoose.Schema.Types.ObjectId,
           ref:"Agent",
           required:true,
        },
        recipientRole:{
            type:String,
            enum: ["SUPERADMIN", "RM", "AGENT"],
            required:true
        },
        title:{
            type:String,
            required:true,
            trim:true,
        },
        message:{
            type:String,
            required:true,
            trim:true,
        },
        sourceType:{
            type:String,
            enum:["ENQUIRY", "CONTACT", "OTHER"],
            default:"ENQUIRY"
        },
        refId:{
            type:mongoose.Schema.Types.ObjectId,
            required:false
        },
        isRead:{
            type:Boolean,
            default:false
        }
    
},{
    timestamps:true
});

export const Notification = mongoose.models.Notification || mongoose.model("Notification",notificationSchema);