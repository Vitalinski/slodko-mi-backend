import {  FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../lib/prisma.js";
import { Prisma } from "@prisma/client";
import { CreateProductBody, ProductsQuery } from "../types/index.js";
import { productsQuerySchema } from "../types/schema.js";

const productsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    "/products",
    {
      schema: {
        querystring: productsQuerySchema,
      },
    },
    async (request: FastifyRequest<{ Querystring: ProductsQuery }>) => {
      const { category, page = 1, limit = 8 } = request.query;
      const skip = (page - 1) * limit;

      let where: Prisma.ProductWhereInput = {};

      if (category) {
        const slugs = category.split(",");

        const categories = await prisma.category.findMany({
          where: {
            slug: {
              in: slugs,
            },
          },
          select: { id: true },
        });

        if (!categories.length) return [];

        where.categoryId = {
          in: categories.map((c) => c.id),
        };
      }
      const totalCount = await prisma.product.count({
        where,
      });
      const products = await prisma.product.findMany({
        where,
        skip,
        take: limit,
      });
      return {
        products,
        totalCount,
      };
    },
  );

  fastify.get("/products/popular", async (request, reply: FastifyReply) => {
    try {
      const popularProducts = await prisma.product.findMany({
        where: {
          isPopular: true,
        },
      });
      return popularProducts;
    } catch (error) {
      reply.status(500);
      return { message: "Failed to get popular products" };
    }
  });

  fastify.post(
    "/products/create",
    async (request: FastifyRequest<{ Body: CreateProductBody }>, reply) => {
      const { category, product } = request.body;

      const productCategory = await prisma.category.findUnique({
        where: { slug: category },
      });

      if (!productCategory) {
        reply.code(404);
        return { message: "Category not found" };
      }
      await prisma.product.create({
        data: product,
      });

      reply.code(201);
      return { message: "Product created" };
    },
  );
}


export default productsRoutes;