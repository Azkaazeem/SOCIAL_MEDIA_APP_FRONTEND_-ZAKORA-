import axios from "axios";

/**
 * Uploads a file directly to Cloudinary using a backend signature (bypasses Vercel 4.5MB limit for videos and large media)
 * with automatic fallback to standard /upload endpoint for small files.
 *
 * @param {File} file - The file to upload (image or video)
 * @returns {Promise<string>} The secure URL of the uploaded file
 */
export const uploadFile = async (file) => {
  if (!file) throw new Error("No file provided");

  // Attempt 1: Direct signed Cloudinary upload (Works for any file size up to 100MB on Vercel)
  try {
    const sigRes = await axios.get("/upload/signature");
    const { signature, timestamp, apiKey, cloudName, folder } = sigRes.data || {};

    if (signature && apiKey && cloudName) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", timestamp);
      formData.append("signature", signature);
      if (folder) formData.append("folder", folder);

      // Direct upload straight to Cloudinary CDN via native fetch
      const cloudinaryRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const cloudinaryData = await cloudinaryRes.json();
      if (!cloudinaryRes.ok) {
        throw new Error(cloudinaryData?.error?.message || "Cloudinary upload failed");
      }

      if (cloudinaryData && cloudinaryData.secure_url) {
        return cloudinaryData.secure_url;
      }
    }
  } catch (directErr) {
    console.warn("Direct Cloudinary upload fallback / error:", directErr?.message || directErr);
    // If the file is a video or larger than 4MB, falling back to Vercel backend /upload will return 413 Content Too Large.
    // Throw descriptive error instead of attempting an impossible 4.5MB Vercel upload.
    if (file.size > 4 * 1024 * 1024 || (file.type && file.type.startsWith("video/"))) {
      throw new Error(`Media upload failed: ${directErr.message || "File too large or rejected"}`);
    }
  }

  // Attempt 2: Standard backend /upload fallback (for small files)
  const fallbackData = new FormData();
  const filename = Date.now() + "_" + file.name;
  fallbackData.append("name", filename);
  fallbackData.append("file", file);

  const res = await axios.post("/upload", fallbackData);
  return res.data?.url || filename;
};
