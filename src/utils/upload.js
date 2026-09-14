import axios from "axios";

/**
 * Uploads a file directly to Cloudinary using a backend signature (bypasses Vercel 4.5MB limit for videos and large media)
 * with automatic fallback to standard /upload endpoint.
 *
 * @param {File} file - The file to upload (image or video)
 * @returns {Promise<string>} The secure URL of the uploaded file
 */
export const uploadFile = async (file) => {
  if (!file) throw new Error("No file provided");

  // Attempt 1: Direct signed Cloudinary upload (Works for any file size up to 100MB on Vercel)
  try {
    const sigRes = await axios.get("/upload/signature");
    const { signature, timestamp, apiKey, cloudName, folder } = sigRes.data;

    if (signature && apiKey && cloudName) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp);
      formData.append("signature", signature);
      if (folder) formData.append("folder", folder);

      // Direct upload straight to Cloudinary CDN
      const cloudinaryRes = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        formData
      );

      if (cloudinaryRes.data && cloudinaryRes.data.secure_url) {
        return cloudinaryRes.data.secure_url;
      }
    }
  } catch (directErr) {
    console.warn("Direct Cloudinary upload fallback to backend upload:", directErr?.message || directErr);
  }

  // Attempt 2: Standard backend /upload fallback
  const fallbackData = new FormData();
  const filename = Date.now() + "_" + file.name;
  fallbackData.append("name", filename);
  fallbackData.append("file", file);

  const res = await axios.post("/upload", fallbackData);
  return res.data?.url || filename;
};
