import { prisma } from "../lib/prisma.js";

import { FastifyPluginAsync, FastifyRequest } from "fastify";
import { CreateCategoryData, Category } from "../types/category.js";
import { deleteProductWithImages } from "../services/manageProductImages.js";
const categoriesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/categories/header", async () => {
    const headerCategories = await prisma.category.findMany({
      where: {
        showInHeader: true,
      },
      orderBy: {
        order: "asc",
      },
    });
    return headerCategories;
  });

  fastify.get("/categories", async () => {
    const allCategories = await prisma.category.findMany({
      orderBy: {
        order: "asc",
      },
    });
    return allCategories;
  });

  fastify.put(
    "/categories/update",
    async (request: FastifyRequest<{ Body: Category }>, reply) => {
      try {
        const body = request.body;
        const id = body.id;

        if (!id) {
          return reply.status(400).send({ message: "Category ID missing" });
        }

        const existingCategory = await prisma.category.findUnique({
          where: { id },
        });

        if (!existingCategory) {
          return reply.status(404).send({ message: "Category not found" });
        }

        const updatedCategory = await prisma.category.update({
          where: { id },
          data: {
            title: body.title,
            slug: body.slug,
            showInHeader: body.showInHeader,
            order: Number(body.order),
          },
        });

        return updatedCategory;
      } catch (error) {
        reply.status(500).send({ message: "Failed to update category" });
      }
    },
  );

  fastify.post(
    "/categories/create",
    async (request: FastifyRequest<{ Body: CreateCategoryData }>, reply) => {
      try {
        const body = request.body;
        const createdCategory = await prisma.category.create({
          data: {
            title: body.title,
            slug: body.slug,
            showInHeader: body.showInHeader,
            order: Number(body.order),
          },
        });

        reply.code(201).send({ category: createdCategory });
      } catch (error) {
        console.error("CREATE ERROR:", error);
        reply.status(500).send({ message: "Failed to create category" });
      }
    },
  );

  fastify.delete(
    "/categories/:id",
    async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
      try {
        const productsInCategory = await prisma.product.findMany({
          where: { categoryId: request.params.id },
        });

        for (const product of productsInCategory) {
          await deleteProductWithImages(product.id);
        }

        await prisma.category.delete({
          where: { id: request.params.id },
        });

        return { message: "Category deleted" };
      } catch (error) {
        reply.status(500).send({ message: "Failed to delete category" });
      }
    },
  );
};

export default categoriesRoutes;
