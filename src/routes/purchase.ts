import { FastifyPluginAsync } from "fastify";
import { validatePromoCode } from "../services/promoCodes.js";
import { emailSchema } from "../schemas/email/schema.js";
import { prisma } from "../lib/prisma.js";
import { OrderStatusRequestBody, PurchaseRequestBody } from "../types/index.js";
import { createPayUPaymentURL } from "../services/payu.js";
import { OrderStatus } from "@prisma/client";
import { getIpAddress } from "../utils/getIpAddress.js";

const purchaseRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post("/purchase/status", async (request, reply) => {
    const orderId = (request.body as OrderStatusRequestBody).orderId;

    if (!orderId) {
      return reply.status(402).send({
        error: { code: "INVALID_ORDER" },
      });
    }

    const currentOrder = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

    return reply.send({
      orderStatus: currentOrder?.paymentStatus,
    });
  });

  fastify.post("/purchase", async (request, reply) => {
    const order = (request.body as PurchaseRequestBody).order;

    if (!order || !order.orderedItems || order.orderedItems.length === 0) {
      return reply.status(402).send({
        error: { code: "INVALID_ORDER" },
      });
    }

    let discount = 0;

    if (order.promoCode) {
      const validateResult = await validatePromoCode(order.promoCode);

      if (!validateResult.valid) {
        return reply.status(401).send({
          error: { code: validateResult.errorCode },
        });
      } else {
        discount = validateResult.discount;
      }
    }

    const parsed = emailSchema.safeParse({ email: order.email });

    if (!parsed.success) {
      return reply.status(477).send({
        error: { code: `INVALID_EMAIL ${order.email}` },
      });
    }

    const basePrice = order.orderedItems.reduce((sum, item) => {
      if (item.quantity < item.minQuantity) {
        throw new Error("INVALID_QUANTITY");
      }

      return sum + item.price * item.quantity;
    }, 0);

    const discountAmount = discount
      ? Math.floor((basePrice * discount) / 100)
      : 0;

    const finalPrice = basePrice - discountAmount;

    if (order.totalPrice !== finalPrice) {
      return reply.status(409).send({
        error: {
          code: "PRICE_CHANGED",
          serverTotal: finalPrice,
        },
      });
    }

    const productsData = order.orderedItems.map((item) => ({
      isPopular: item.isPopular,
      minQuantity: item.minQuantity,
      price: item.price,
      quantity: item.quantity,
      title: item.title,
      unit: item.unit,
    }));

    const createdOrder = await prisma.order.create({
      data: {
        email: order.email,
        name: order.name,
        phone: order.phone,
        deliveryType: order.deliveryType,
        promoCode: order.promoCode,
        totalPrice: finalPrice,
        discount,
        discountAmount,
        dateOfOrder: new Date(order.dateOfOrder),
        postalCode: order.postalCode,
        street: order.street,
        houseNumber: order.houseNumber,
        items: {
          createMany: {
            data: productsData,
          },
        },
      },
    });

    const customerIp = getIpAddress(request);

    const paymentURL = await createPayUPaymentURL({
      amount: finalPrice,
      email: order.email,
      orderId: createdOrder.id.toString(),
      customerIp,
    });

    return reply.send({
      redirectUrl: paymentURL,
    });
  });
};
export default purchaseRoutes;
