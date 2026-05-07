import { S3Client } from "@aws-sdk/client-s3";
import { ENV } from "./ENV.js";

const s3Client = new S3Client({
  region: ENV.AWS_REGION,
  credentials: {
    accessKeyId: ENV.AWS_ACCESS_KEY_ID,
    secretAccessKey: ENV.AWS_SECRET_ACCESS_KEY,
  },
  requestChecksumCalculation: "when_required",
  responseChecksumValidation: "when_required",
});

export default s3Client;
