import { RequestHandler } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

// Create upload directories if they don't exist
const vendorUploadDir = path.join(process.cwd(), "public", "uploads", "vendors");
const productUploadDir = path.join(process.cwd(), "public", "uploads", "products");

if (!fs.existsSync(vendorUploadDir)) {
  fs.mkdirSync(vendorUploadDir, { recursive: true });
}
if (!fs.existsSync(productUploadDir)) {
  fs.mkdirSync(productUploadDir, { recursive: true });
}

// Configure multer for vendor uploads
const vendorStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, vendorUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, `${req.body.type || "image"}-${uniqueSuffix}${extension}`);
  },
});

// Configure multer for product uploads
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, productUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, `product-image-${uniqueSuffix}${extension}`);
  },
});

const vendorUpload = multer({
  storage: vendorStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

const productUpload = multer({
  storage: productStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Upload vendor image handler
export const uploadVendorImage = [
  vendorUpload.single("file"),
  (req: any, res: any) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Return the URL path to access the uploaded file
      const url = `/uploads/vendors/${req.file.filename}`;

      res.json({
        success: true,
        url,
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Upload failed" });
    }
  },
];

// Handle upload errors
export const handleUploadError = (
  error: any,
  req: any,
  res: any,
  next: any,
) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ error: "File too large. Maximum size is 5MB." });
    }
  }

  if (error.message === "Only image files are allowed") {
    return res.status(400).json({ error: "Only image files are allowed" });
  }

  return res.status(500).json({ error: "Upload failed" });
};

// Upload product image handler
export const uploadProductImage = [
  productUpload.single("file"),
  (req: any, res: any) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Return the URL path to access the uploaded file
      const url = `/uploads/products/${req.file.filename}`;

      res.json({
        success: true,
        url,
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
      });
    } catch (error) {
      console.error("Product upload error:", error);
      res.status(500).json({ error: "Upload failed" });
    }
  },
];
