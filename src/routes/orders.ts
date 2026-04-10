import { Prisma } from "@prisma/client";
import { FastifyPluginAsync, FastifyRequest } from "fastify";
import { prisma } from "../lib/prisma.js";
import { ordersQuerySchema } from "../types/schema.js";
import { OrdersQuery, UpdateOrderStatusData } from "../types/index.js";

const START_PAGE = 1;
const LIMIT = 8;

const ordersRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    "/orders",
    {
      schema: {
        querystring: ordersQuerySchema,
      },
    },
    async (request: FastifyRequest<{ Querystring: OrdersQuery }>) => {
      const {
        orderStatuses,
        searchValue,
        page = START_PAGE,
        limit = LIMIT,
      } = request.query;

      const skip = (page - 1) * limit;

      const where: Prisma.OrderWhereInput = {};

      if (searchValue?.trim()) {
        where.OR = [
          {
            email: {
              contains: searchValue,
              mode: "insensitive",
            },
          },
          {
            name: {
              contains: searchValue,
              mode: "insensitive",
            },
          },
        ];
      }

      if (orderStatuses?.length) {
        where.orderStatus = {
          in: orderStatuses,
        };
      }

      const [totalCount, orders] = await Promise.all([
        prisma.order.count({ where }),
        prisma.order.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
      ]);

      return { orders, totalCount };
    },
  );

  fastify.get("/orders/new", async (request: FastifyRequest) => {
    const totalCount = await prisma.order.count({
      where: { orderStatus: "NEW" },
    });
    return totalCount;
  });

  fastify.patch(
    "/orders/:id",
    async (
      request: FastifyRequest<{
        Body: UpdateOrderStatusData;
        Params: { id: string };
      }>,
      reply,
    ) => {
      const { newStatus } = request.body;
      const { id } = request.params;

      if (!id) {
        return reply.status(400).send({ message: "Order ID missing" });
      }
      if (!newStatus) {
        return reply.status(400).send({ message: "New status ID missing" });
      }

      try {
        const updatedOrder = await prisma.order.update({
          where: { id },
          data: { orderStatus: newStatus },
        });

        return updatedOrder;
      } catch (e:any) {
        if (e.code === "P2025") {
          return reply.status(404).send({ message: "Order not found" });
        }

        console.error(e);
        return reply.status(500).send({ message: "Failed to update order" });
      }
    },
  );
};
export default ordersRoutes;
