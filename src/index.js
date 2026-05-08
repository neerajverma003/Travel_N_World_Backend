import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from "url";
import app from "./server.js";
import connectToDatabase from "./db/db.js";

// Safe path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Connect to the database
    await connectToDatabase();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
}

// Start the server
startServer();
