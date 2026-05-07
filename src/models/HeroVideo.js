import mongoose from "mongoose";

const HeroVideoSchema = new mongoose.Schema({
  title:{type:String,required:true},
  url:{type:String,required:true},
  order:{type:Number,default:0},
  isActive:{type:Boolean,default:true}
},{
  timestamps:true
})
export default mongoose.model("HeroVideo",HeroVideoSchema);