import express from "express";
import { generatePresignedUrl } from "../services/s3Service.js";

const router = express.Router();

/**
 * Route to get a presigned S3 URL for file upload
 * Expected body: { fileName, fileType, folder }
 */
router.post("/presigned-url", async (req, res) => {
  try {
    const { fileName, fileType, folder } = req.body;
    
    if (!fileName || !fileType) {
      return res.status(400).json({ success: false, message: "fileName and fileType are required" });
    }

    const { uploadUrl, fileKey } = await generatePresignedUrl(fileName, fileType, folder);

    res.status(200).json({
      success: true,
      uploadUrl,
      fileKey
    });
  } catch (error) {
    console.error("Presigned URL generation error:", error);
    res.status(500).json({ success: false, message: "Failed to generate presigned URL", error: error.message });
  }
});

export default router;


