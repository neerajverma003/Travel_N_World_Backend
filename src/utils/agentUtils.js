import { getPresignedViewUrl } from "../services/s3Service.js";
import { ENV } from "../config/ENV.js";

/**
 * Sign S3 URLs in an agent document
 */
export async function signAgent(agent) {
  if (!agent) return null;
  const obj = agent.toObject ? agent.toObject() : agent;

  // 1. Sign basic profile images
  if (obj.photo) {
    obj.photo = await getPresignedViewUrl(obj.photo);
  }
  if (obj.bannerImage) {
    if (Array.isArray(obj.bannerImage)) {
      obj.bannerImage = await Promise.all(
        obj.bannerImage.map((img) => getPresignedViewUrl(img))
      );
    } else {
      obj.bannerImage = await getPresignedViewUrl(obj.bannerImage);
    }
  }

  // 2. Sign gallery photos
  if (Array.isArray(obj.agentPhotos)) {
    obj.agentPhotos = await Promise.all(
      obj.agentPhotos.map((img) => getPresignedViewUrl(img))
    );
  }

  // 3. Sign gallery videos
  if (Array.isArray(obj.agentVideos)) {
    obj.agentVideos = await Promise.all(
      obj.agentVideos.map((vid) => getPresignedViewUrl(vid))
    );
  }

  // 4. Sign testimonial images
  if (Array.isArray(obj.testimonials)) {
    obj.testimonials = await Promise.all(
      obj.testimonials.map(async (t) => {
        if (t.image) t.image = await getPresignedViewUrl(t.image);
        if (t.profile) t.profile = await getPresignedViewUrl(t.profile);
        return t;
      })
    );
  }

  // 5. Sign blogs array
  if (Array.isArray(obj.blogs)) {
    obj.blogs = await Promise.all(
      obj.blogs.map(async (b) => {
        if (b.image) b.image = await getPresignedViewUrl(b.image);
        return b;
      })
    );
  }

  // 6. Sign curated reviews (reviewsList)
  if (Array.isArray(obj.reviewsList)) {
    obj.reviewsList = await Promise.all(
      obj.reviewsList.map(async (r) => {
        return r;
      })
    );
  }

  return obj;
}

/**
 * Sign S3 URLs in a review document
 */
export async function signReview(review) {
  if (!review) return null;
  const obj = review.toObject ? review.toObject() : review;

  if (Array.isArray(obj.images)) {
    obj.images = await Promise.all(
      obj.images.map((img) => getPresignedViewUrl(img))
    );
  }

  return obj;
}

/**
 * Extract S3 key from a full/signed URL
 */
export function extractKey(url) {
  if (!url || typeof url !== "string") return url;

  // 1. If it's already just a key (no http), return as is
  if (!url.startsWith("http")) return url;

  // 2. If it's a signed URL or full S3 URL, extract the part between bucket domain and query params
  // Example: https://bucket.s3.region.amazonaws.com/folder/file.jpg?X-Amz-Algorithm=...
  try {
    const parsed = new URL(url);
    let key = parsed.pathname;
    if (key.startsWith("/")) key = key.slice(1);
    return key;
  } catch (e) {
    return url;
  }
}

/**
 * Recursively extract keys from an object or array
 */
export function cleanS3Data(data) {
  if (!data) return data;

  if (Array.isArray(data)) {
    return data.map((item) => cleanS3Data(item));
  }

  if (typeof data === "object") {
    // If it's a Mongoose object, we might not want to mutate it directly if it's already a model instance
    // but here we expect plain objects from req.body
    const cleaned = { ...data };
    for (const key in cleaned) {
      if (typeof cleaned[key] === "string" && cleaned[key].startsWith("http")) {
        // Only clean if it looks like it belongs to our S3 or CDN
        if (cleaned[key].includes("amazonaws.com") || cleaned[key].includes(ENV.CDN_DOMAIN)) {
          cleaned[key] = extractKey(cleaned[key]);
        }
      } else if (cleaned[key] && typeof cleaned[key] === "object") {
        cleaned[key] = cleanS3Data(cleaned[key]);
      }
    }
    return cleaned;
  }

  if (typeof data === "string" && data.startsWith("http") && (data.includes("amazonaws.com") || data.includes(ENV.CDN_DOMAIN))) {
    return extractKey(data);
  }

  return data;
}
