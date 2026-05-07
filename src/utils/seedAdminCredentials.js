import AdminLoginCredential from "../models/adminLoginCredential.js";
import { ROLES } from "./constant.js";

/**
 * Seed initial admin and developer credentials
 */
export const seedAdminCredentials = async () => {
  try {
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL;
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD;

    const developerEmail = process.env.INITIAL_DEV_EMAIL;
    const developerPassword = process.env.INITIAL_DEV_PASSWORD;

    // 1. Check/Update Super Admin
    const existingAdmin = await AdminLoginCredential.findOne({ email: adminEmail });
    if (!existingAdmin) {
      await AdminLoginCredential.create({
        email: adminEmail,
        password: adminPassword,
        role: ROLES.SUPERADMIN
      });
    
    } else {
      existingAdmin.password = adminPassword;
      await existingAdmin.save();
      
    }

    // 2. Check/Update Developer Admin
    const existingDev = await AdminLoginCredential.findOne({ email: developerEmail });
    if (!existingDev) {
      await AdminLoginCredential.create({
        email: developerEmail,
        password: developerPassword,
        role: ROLES.SUPERADMIN
      });
     
    } else {
      existingDev.password = developerPassword;
      await existingDev.save();
    }

    // 3. Delete any other admin accounts that are not in the .env file
    const deletionResult = await AdminLoginCredential.deleteMany({
      email: { $nin: [adminEmail.toLowerCase(), developerEmail.toLowerCase()] }
    });

    if (deletionResult.deletedCount > 0) {
      console.log(`🧹 Cleaned up ${deletionResult.deletedCount} old/unauthorized admin accounts.`);
    }

  } catch (error) {
    console.error(" Seeding admin credentials failed:", error.message);
  }
};
