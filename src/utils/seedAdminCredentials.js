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

    // 1. Check/Create Super Admin
    const existingAdmin = await AdminLoginCredential.findOne({ email: adminEmail });
    if (!existingAdmin) {
      await AdminLoginCredential.create({
        email: adminEmail,
        password: adminPassword,
        role: ROLES.SUPERADMIN
      });
      console.log(` Initial Super Admin created: ${adminEmail}`);
    }

    // 2. Check/Create Developer Admin
    const existingDev = await AdminLoginCredential.findOne({ email: developerEmail });
    if (!existingDev) {
      await AdminLoginCredential.create({
        email: developerEmail,
        password: developerPassword,
        role: ROLES.SUPERADMIN
      });
      console.log(` Initial Developer Admin created: ${developerEmail}`);
    }

    // 3. (Removed) Automatic deletion of other accounts to allow manual management


  } catch (error) {
    console.error(" Seeding admin credentials failed:", error.message);
  }
};
