import { v2 as cloudinary } from "cloudinary";

export async function uploadBufferToCloudinary(file: Express.Multer.File, folder: string) {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    return {
      url: `local-pending://${encodeURIComponent(file.originalname)}`,
      publicId: `local/${Date.now()}-${file.originalname}`
    };
  }

  const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ resource_type: "auto", folder }, (error, response) => {
      if (error || !response) reject(error ?? new Error("Upload failed"));
      else resolve(response as { secure_url: string; public_id: string });
    });
    stream.end(file.buffer);
  });

  return { url: result.secure_url, publicId: result.public_id };
}
