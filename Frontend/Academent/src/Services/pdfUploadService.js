const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const uploadPdfToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("pdf", file);

  const response = await fetch(`${API_BASE_URL}/api/notes/upload-pdf`, {
    method: "POST",
    body: formData,
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.message || "PDF upload failed");
  }

  return {
    title: result.originalName || file.name,
    url: result.pdfUrl,
    size: result.size,
    publicId: result.publicId,
    extractedText: result.extractedText || "",
    storageProvider: result.storageProvider || "cloudinary",
    fileType: result.fileType || "application/pdf",
  };
};
