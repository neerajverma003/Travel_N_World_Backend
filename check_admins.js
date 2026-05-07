import mongoose from "mongoose";
import 'dotenv/config';
import AdminLoginCredential from "./src/models/adminLoginCredential.js";
import connectToDatabase from "./src/db/db.js";

const checkAdmins = async () => {
  await connectToDatabase();
  const admins = await AdminLoginCredential.find({});
  admins.forEach(a => console.log(`- ${a.email} (${a.role})`));
  process.exit(0);
};

checkAdmins();
