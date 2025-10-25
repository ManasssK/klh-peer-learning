// lib/cloudinary.js

// Cloudinary configuration
export const cloudinaryConfig = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
};

// Helper to get upload widget
export function openUploadWidget(options, callback) {
  if (typeof window !== 'undefined' && window.cloudinary) {
    window.cloudinary.openUploadWidget(options, callback);
  }
}
