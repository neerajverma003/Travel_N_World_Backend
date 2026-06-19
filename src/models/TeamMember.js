import mongoose from "mongoose";
import bcrypt from "bcrypt";
const {Schema} = mongoose;
const SALT_ROUNDS=parseInt(process.env.SALT_ROUNDS || "10",10);
const teamMemberSchema = new Schema({
  name:{type:String,required:true,trim:true},
  email:{type:String,required:true,unique:true,lowercase:true,trim:true},
  password:{type:String,required:true,select:false},
  phone:{type:String},
  
  agentId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Agent',
    required:true
  },
  isActive:{type:Boolean,default:true},
  // here agent will decide to give access to which fields to the team member
  permissions:{
   canManageLeads:{type:Boolean,default:true},
   canManageItenerary:{type:Boolean,default:false},
   canManageBookings:{type:Boolean,default:false},
   canViewReports:{type:Boolean,default:false},
   canManageSettings:{type:Boolean,default:false},
   
  }
},
{
  timestamps:true
})

// before save hash the password 
teamMemberSchema.pre('save',async function(next){
  if(this.isModified("password")){
    const looksHashed=typeof this.password==="string" && /^\$2[aby]\$\d{2}\$/.test(this.password);
    if(!looksHashed){
      this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
    }
  }
  next();
})

// at the login match the password , is correct
teamMemberSchema.methods.comparePassword = async function(candidate){
  return bcrypt.compare(candidate,this.password);
}

const teamMember = mongoose.models.teamMember || mongoose.model("TeamMember",teamMemberSchema);
export default teamMember;
