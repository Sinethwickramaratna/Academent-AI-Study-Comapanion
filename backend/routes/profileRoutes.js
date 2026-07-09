import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();
const uploadDir = "uploads/profile-photos/";
const allowedImageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

const removeTempFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

const sanitizeFileBaseName = (fileName) => {
  const parsedName = path.parse(fileName).name;
  return parsedName
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "") || "academent-profile-photo";
};

const handlePhotoUpload = (req, res, next) => {
  upload.single("photo")(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    res.status(400).json({
      message: error.code === "LIMIT_FILE_SIZE"
        ? "Profile photo must be 5 MB or smaller"
        : error.message || "Profile photo upload failed",
    });
  });
};

router.post("/upload-photo", handlePhotoUpload, async (req, res) => {
  const file = req.file;

  try {
    if (!file) {
      return res.status(400).json({ message: "No profile photo uploaded" });
    }

    const extension = path.extname(file.originalname).toLowerCase();
    const isImage = file.mimetype?.startsWith("image/") && allowedImageExtensions.has(extension);

    if (!isImage) {
      removeTempFile(file.path);
      return res.status(400).json({ message: "Only JPG, PNG, WEBP, or GIF images are allowed" });
    }

    const publicId = `${sanitizeFileBaseName(file.originalname)}-${Date.now()}`;
    const result = await cloudinary.uploader.upload(file.path, {
      resource_type: "image",
      folder: "academent/profile-photos",
      public_id: publicId,
      overwrite: false,
      transformation: [
        { width: 512, height: 512, crop: "fill", gravity: "face" },
        { quality: "auto", fetch_format: "auto" },
      ],
    });

    removeTempFile(file.path);

    res.status(201).json({
      message: "Profile photo uploaded successfully",
      photoUrl: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      storageProvider: "cloudinary",
      resourceType: result.resource_type,
    });
  } catch (error) {
    removeTempFile(file?.path);

    res.status(500).json({
      message: "Profile photo upload failed",
      error: error.message,
    });
  }
});

export default router;
