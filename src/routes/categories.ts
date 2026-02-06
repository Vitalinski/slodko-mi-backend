import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";

export  function categoriesRoutes(fastify: FastifyInstance) {
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
}
