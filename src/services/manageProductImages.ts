import { MultipartFile } from "@fastify/multipart";
import { prisma } from "../lib/prisma.js";
import { deleteManyImages, uploadImage } from "./claudinary.js";
import { ProductImage } from "../types/index.js";

type IncomingProductImage = {
  id?: string;
  order: number;
  hasFile: boolean;
};

export async function syncProductImages(
  productId: string,
  parsedImages: IncomingProductImage[],
  files: MultipartFile[],
  existingImages: ProductImage[],
) {
  let fileIndex = 0;
  const incomingIds: string[] = [];

  for (const [index, image] of parsedImages.entries()) {
    if (image.id && !image.hasFile) {
      incomingIds.push(image.id);

      await prisma.productImage.update({
        where: { id: image.id },
        data: { order: index },
      });
    }

    if (image.hasFile) {
      const file = files[fileIndex++];
      if (!file) continue;

      const uploadResult = await uploadImage(file);

      await prisma.productImage.create({
        data: {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          order: index,
          productId,
        },
      });
    }
  }

  const imagesToDelete = existingImages.filter(
    (img) =>
      !incomingIds.includes(img.id) &&
      !parsedImages.some((p) => p.hasFile && p.order === img.order),
  );

  await deleteManyImages(imagesToDelete.map((i) => i.publicId));

  await prisma.productImage.deleteMany({
    where: { id: { in: imagesToDelete.map((i) => i.id) } },
  });
}

export async function deleteProductWithImages(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { images: true },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  await deleteManyImages(product.images.map((img) => img.publicId));

  await prisma.product.delete({
    where: { id: productId },
  });
}
