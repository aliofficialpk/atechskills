import { v2 as cloudinary } from "cloudinary";

export async function uploadBufferToCloudinary(file: Express.Multer.File, folder: string) {
  if (!process.env.CLOUDINARY_CLOUD_NAME && !process.env.CLOUDINARY_URL) {
    return {
      url: `local-pending://${encodeURIComponent(file.originalname)}`,
      publicId: `local/${Date.now()}-${file.originalname}`
    };
  }

  const resourceType = file.mimetype === "application/pdf" ? "raw" : "auto";
  const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({
      resource_type: resourceType,
      folder,
      use_filename: true,
      unique_filename: true,
      filename_override: file.originalname
    }, (error, response) => {
      if (error || !response) reject(error ?? new Error("Upload failed"));
      else resolve(response as { secure_url: string; public_id: string });
    });
    stream.end(file.buffer);
  });

  return { url: result.secure_url, publicId: result.public_id };
}
