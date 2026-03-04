import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

export default cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function uploadImage(file: any, folder: string = "products") {
  const buffer = await file.toBuffer();

  return new Promise<any>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (err, result) => (err ? reject(err) : resolve(result)),
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
}

export async function deleteImage(publicId: string) {
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId);
}

export async function deleteManyImages(publicIds: string[]) {
  await Promise.all(publicIds.map(deleteImage));
}
