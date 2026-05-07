import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client from "../config/s3Config.js";
import { ENV } from "../config/ENV.js";

/**
 * Clean filename: remove spaces, special characters, and convert to lowercase.
 * This prevents URL encoding issues and keeps S3 keys clean.
 */
const sanitizeFileName = (fileName) => {
  return fileName
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/[^\w.-]+/g, ""); // Remove special characters except dots and hyphens
};

/**
 * Generate a presigned URL for UPLOADING a file directly from the frontend (PUT).
 * @param {string} fileName - Original name of the file.
 * @param {string} fileType - MIME type (e.g., image/jpeg).
 * @param {string} folder - Destination folder in S3 bucket.
 * @returns {Promise<{uploadUrl: string, fileKey: string}>}
 */
export const generatePresignedUrl = async (fileName, fileType, folder = "uploads") => {
  const sanitized = sanitizeFileName(fileName);
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const fileKey = `${folder}/${Date.now()}-${randomSuffix}-${sanitized}`;
  
  const command = new PutObjectCommand({
    Bucket: ENV.AWS_BUCKET_NAME,
    Key: fileKey,
    ContentType: fileType,
  });

  // The upload URL will expire in 5 minutes
  const uploadUrl = await getSignedUrl(s3Client, command, { 
    expiresIn: 300 
  });
  
  return { uploadUrl, fileKey };
};

/**
 * Generate a presigned URL for VIEWING a private S3 object (GET).
 * @param {string} fileKey - The S3 object key or a full URL (will be parsed).
 * @param {number} expiresIn - Expiration time in seconds (default 1 hour).
 * @returns {Promise<string>} - Temporary public viewing URL.
 */
export const getPresignedViewUrl = async (fileKey, expiresIn = 14400) => {
  if (!fileKey) return "";
  
  let key = fileKey;

  // Handle full URLs (S3 or CDN)
  if (typeof fileKey === 'string' && fileKey.startsWith('http')) {
    try {
      const url = new URL(fileKey);
      let pathname = url.pathname;
      
      // Remove leading slash
      if (pathname.startsWith('/')) {
        pathname = pathname.substring(1);
      }
      
      // Remove bucket name from path if it exists (e.g. s3.amazonaws.com/bucket-name/key)
      const bucketPrefix = `${ENV.AWS_BUCKET_NAME}/`;
      if (pathname.startsWith(bucketPrefix)) {
        pathname = pathname.substring(bucketPrefix.length);
      }
      
      key = pathname;
    } catch (e) {
      // Fallback for weirdly formatted URLs
      if (fileKey.includes('.amazonaws.com/')) {
        key = fileKey.split('.amazonaws.com/')[1].split('?')[0];
      }
    }
  }

  // Ensure key doesn't have a leading slash
  if (typeof key === 'string' && key.startsWith('/')) {
    key = key.substring(1);
  }

  // If CDN is configured, return the clean CDN URL
  if (ENV.CDN_DOMAIN) {
    return `https://${ENV.CDN_DOMAIN}/${key}`;
  }

  // Fallback to signed S3 URL if no CDN is configured
  try {
    const command = new GetObjectCommand({
      Bucket: ENV.AWS_BUCKET_NAME,
      Key: key,
    });
    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    console.error("Error generating media URL:", error);
    return fileKey;
  }
};
