import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { PDFParse } from "pdf-parse";
import cloudinary from "../config/cloudinary.js";

const router = express.Router();
const uploadDir = "uploads/";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 25 * 1024 * 1024,
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
    .replace(/^-+|-+$/g, "") || "academent-pdf";
};

const extractPdfText = async (filePath) => {
  const buffer = fs.readFileSync(filePath);
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    return String(result.text || "").replace(/\s+/g, " ").trim();
  } finally {
    await parser.destroy();
  }
};

router.post("/upload-pdf", upload.single("pdf"), async (req, res) => {
  const file = req.file;

  try {
    if (!file) {
      return res.status(400).json({ message: "No PDF uploaded" });
    }

    const isPdf = file.mimetype === "application/pdf" || path.extname(file.originalname).toLowerCase() === ".pdf";
    if (!isPdf) {
      removeTempFile(file.path);
      return res.status(400).json({ message: "Only PDF files are allowed" });
    }

    const extractedText = await extractPdfText(file.path);
    if (!extractedText) {
      removeTempFile(file.path);
      return res.status(422).json({
        message: "No selectable text could be extracted from this PDF",
      });
    }

    const publicId = `${sanitizeFileBaseName(file.originalname)}-${Date.now()}.pdf`;
    const result = await cloudinary.uploader.upload(file.path, {
      resource_type: "raw",
      type: "upload",
      access_mode: "public",
      folder: "academent/pdfs",
      public_id: publicId,
      overwrite: false,
    });

    removeTempFile(file.path);

    res.status(201).json({
      message: "PDF uploaded successfully",
      pdfUrl: result.secure_url,
      publicId: result.public_id,
      size: result.bytes,
      format: result.format || "pdf",
      originalName: file.originalname,
      extractedText,
      storageProvider: "cloudinary",
      fileType: "application/pdf",
      resourceType: result.resource_type,
    });
  } catch (error) {
    removeTempFile(file?.path);

    res.status(500).json({
      message: "PDF upload failed",
      error: error.message,
    });
  }
});

export default router;
