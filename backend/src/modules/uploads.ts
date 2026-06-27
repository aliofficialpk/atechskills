import { Router } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { asyncRoute } from "../lib/async-route.js";
import { requireAuth } from "../middleware/auth.js";

export const uploadsRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf", "video/mp4"];
    cb(null, allowed.includes(file.mimetype));
  }
});

uploadsRouter.post("/", requireAuth, upload.single("file"), asyncRoute(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "File is required" });
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    return res.status(202).json({ message: "Upload accepted. Configure Cloudinary for persistent storage.", filename: req.file.originalname });
  }
  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ resource_type: "auto", folder: "atechskills" }, (error, response) => (error ? reject(error) : resolve(response)));
    stream.end(req.file!.buffer);
  });
  res.status(201).json(result);
}));
