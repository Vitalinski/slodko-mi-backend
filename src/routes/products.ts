import { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../lib/prisma.js";
import { Prisma } from "@prisma/client";
import {
  CreateProductFormData,
  ProductsQuery,
  UpdateProductFormData,
} from "../types/index.js";
import { productsQuerySchema } from "../types/schema.js";
import { uploadImage } from "../services/claudinary.js";
import {
  deleteProductWithImages,
  syncProductImages,
} from "../services/manageProductImages.js";

const START_PAGE = 1;
const LIMIT = 8;

const productsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    "/products",
    {
      schema: {
        querystring: productsQuerySchema,
      },
    },
    async (request: FastifyRequest<{ Querystring: ProductsQuery }>) => {
      const {
        categories,
        onlyPopular,
        searchValue,
        page = START_PAGE,
        limit = LIMIT,
      } = request.query;

      const skip = (page - 1) * limit;

      const where: Prisma.ProductWhereInput = {};

      if (searchValue) {
        where.title = {
          contains: searchValue,
          mode: "insensitive",
        };
      }

      if (onlyPopular === true) {
        where.isPopular = true;
      }

      if (categories) {
        const slugs = categories;

        const categoryIds = await prisma.category.findMany({
          where: { slug: { in: slugs } },
          select: { id: true },
        });

        if (!categoryIds.length) {
          return { products: [], totalCount: 0 };
        }

        where.categoryId = {
          in: categoryIds.map((c) => c.id),
        };
      }

      const [totalCount, products] = await Promise.all([
        prisma.product.count({ where }),
        prisma.product.findMany({
          where,
          skip,
          take: limit,
          include: { category: true, images: true },
          orderBy: { createdAt: "desc" },
        }),
      ]);

      const formattedProducts = products.map((product) => ({
        ...product,
        images: product.images.map((img) => {
          return { url: img.url, order: img.order, id: img.id };
        }),
      }));

      return { products: formattedProducts, totalCount };
    },
  );

  fastify.get("/products/popular", async (request, reply: FastifyReply) => {
    try {
      const popularProducts = await prisma.product.findMany({
        where: {
          isPopular: true,
        },
        include: { images: true },
      });

      const formattedProducts = popularProducts.map((product) => ({
        ...product,
        images: product.images.map((img) => {
          return { url: img.url, order: img.order, id: img.id };
        }),
      }));

      return formattedProducts;
    } catch (error) {
      reply.status(500);
      return { message: "Failed to get popular products" };
    }
  });

  fastify.put(
    "/products/update",
    async (request: FastifyRequest<{ Body: UpdateProductFormData }>, reply) => {
      try {
        const body = request.body;
        const id = body.id?.value;

        if (!id) {
          return reply.status(400).send({ message: "Product ID missing" });
        }

        const existingProduct = await prisma.product.findUnique({
          where: { id },
          include: { images: true },
        });

        if (!existingProduct) {
          return reply.status(404).send({ message: "Product not found" });
        }

        const parsedImages = body.images?.value
          ? JSON.parse(body.images.value)
          : [];

        const files = body.files
          ? Array.isArray(body.files)
            ? body.files
            : [body.files]
          : [];

        await syncProductImages(
          id,
          parsedImages,
          files,
          existingProduct.images,
        );

        const updatedProduct = await prisma.product.update({
          where: { id },
          data: {
            title: body.title.value,
            description: body.description.value,
            price: Number(body.price.value),
            unit: body.unit.value,
            minQuantity: Number(body.minQuantity.value),
            isPopular: body.isPopular.value === "true",
            categoryId: body.categoryId.value,
          },
          include: {
            category: true,
            images: { orderBy: { order: "asc" } },
          },
        });

        return updatedProduct;
      } catch (error) {
        reply.status(500).send({ message: "Failed to update product" });
      }
    },
  );

  fastify.post(
    "/products/create",
    async (request: FastifyRequest<{ Body: CreateProductFormData }>, reply) => {
      try {
        const body = request.body;

        const parsedImages = body.images?.value
          ? JSON.parse(body.images.value)
          : [];

        const files = body.files
          ? Array.isArray(body.files)
            ? body.files
            : [body.files]
          : [];

        const imagesToCreate: any[] = [];
        let fileIndex = 0;

        for (const [index, image] of parsedImages.entries()) {
          if (image.hasFile) {
            const file = files[fileIndex++];
            if (!file) continue;
            const uploadResult = await uploadImage(file);

            imagesToCreate.push({
              url: uploadResult.secure_url,
              publicId: uploadResult.public_id,
              order: index,
            });
          }
        }

        const createdProduct = await prisma.product.create({
          data: {
            title: body.title.value,
            description: body.description.value,
            price: Number(body.price.value),
            unit: body.unit.value,
            minQuantity: Number(body.minQuantity.value),
            isPopular: body.isPopular.value === "true",
            categoryId: body.categoryId.value,
            images: {
              create: imagesToCreate,
            },
          },
          include: {
            category: true,
            images: {
              orderBy: { order: "asc" },
            },
          },
        });

        reply.code(201).send({ product: createdProduct });
      } catch (error) {
        console.error("CREATE ERROR:", error);
        reply.status(500).send({ message: "Failed to create product" });
      }
    },
  );

  fastify.delete(
    "/products/:id",
    async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
      try {
        await deleteProductWithImages(request.params.id);
        return { message: "Product deleted" };
      } catch (error) {
        if (error instanceof Error) {
          reply.status(500).send({ message: error.message });
        } else {
          reply.status(500).send({ message: "Unknown error" });
        }
      }
    },
  );
};
export default productsRoutes;
