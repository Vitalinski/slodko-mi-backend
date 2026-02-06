import { prisma } from "../lib/prisma.js";

import { FastifyPluginAsync } from "fastify";
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
}

export default categoriesRoutes;