const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const uploadProfilePhotoToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("photo", file);

  const response = await fetch(`${API_BASE_URL}/api/profile/upload-photo`, {
    method: "POST",
    body: formData,
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || "Profile photo upload failed");
  }

  return {
    url: result.photoUrl,
    publicId: result.publicId,
    width: result.width,
    height: result.height,
    format: result.format,
    storageProvider: result.storageProvider || "cloudinary",
  };
};
