import "dotenv/config";
import connectToDatabase from "./db.js";
import { seedAdminCredentials } from "../utils/seedAdminCredentials.js";

const runSeed = async () => {
  try {
    await connectToDatabase();
    console.log("Connected to database...");

    const args = process.argv.slice(2);
    if (args.length >= 2) {
      // Create specifically from arguments
      const [email, password] = args;
      const AdminLoginCredential = (await import("../models/adminLoginCredential.js")).default;
      const { ROLES } = await import("../utils/constant.js");

      const existing = await AdminLoginCredential.findOne({ email: email.toLowerCase() });
      if (existing) {
        console.log(`-Admin with email ${email} already exists.`);
      }
       else {
        await AdminLoginCredential.create({
          email: email.toLowerCase(),
          password,
          role: ROLES.SUPERADMIN
        });
        console.log(`Admin created successfully: ${email}`);
      }
    } else {
      // Fallback to the utility (which uses .env)
      console.log("No arguments provided, checking .env for INITIAL_ADMIN_EMAIL...");
      await seedAdminCredentials();
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Operation failed:", error);
    process.exit(1);
  }
};


runSeed();
