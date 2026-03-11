import { projectId, publicAnonKey } from "/utils/supabase/info";

const STORAGE_URL = `https://${projectId}.supabase.co/storage/v1/object/public`;
const API_BASE = `https://${projectId}.supabase.co/storage/v1/object`;

const headers = {
  "Authorization": `Bearer ${publicAnonKey}`,
};

/**
 * Upload a file to Supabase Storage and return the public URL
 */
export async function uploadImage(
  file: File,
  bucket: string = "images",
  path: string
): Promise<string> {
  try {
    const response = await fetch(`${API_BASE}/${bucket}/${path}`, {
      method: "POST",
      headers,
      body: file,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to upload image");
    }

    // Return the public URL
    return `${STORAGE_URL}/${bucket}/${path}`;
  } catch (err) {
    console.error("Storage upload error:", err);
    throw err;
  }
}

/**
 * Generate a unique filename for storing images
 */
export function generateImagePath(userId: string, type: "profile" | "hobby", hobbyName?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);

  if (type === "profile") {
    return `users/${userId}/profile/${timestamp}-${random}.jpg`;
  } else {
    const sanitizedHobby = hobbyName?.replace(/\s+/g, "-").toLowerCase() || "hobby";
    return `users/${userId}/hobbies/${sanitizedHobby}-${timestamp}-${random}.jpg`;
  }
}

/**
 * Convert a data URL (from canvas) to a File object for upload
 */
export async function dataURLtoFile(dataURL: string, filename: string): Promise<File> {
  const arr = dataURL.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const bstr = atob(arr[1]);
  const n = bstr.length;
  const u8arr = new Uint8Array(n);

  for (let i = 0; i < n; i++) {
    u8arr[i] = bstr.charCodeAt(i);
  }

  return new File([u8arr], filename, { type: mime });
}
