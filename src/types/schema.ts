import { OrderStatus } from "@prisma/client";

export const productsQuerySchema = {
  type: "object",
  properties: {
    categories: { type: "array", items: { type: "string" } },
    searchValue: { type: "string" },
    onlyPopular: { type: "boolean" },
    page: { type: "number", default: 1 },
    limit: { type: "number", default: 8 },
  },
};

export const ordersQuerySchema = {
  type: "object",
  properties: {
    orderStatuses: {
      type: "array",
      items: {
        type: "string",
        enum: Object.values(OrderStatus),
      },
    },
    searchValue: { type: "string" },
    page: { type: "number", default: 1 },
    limit: { type: "number", default: 8 },
  },
};
