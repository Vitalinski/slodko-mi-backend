import { FastifyInstance } from "fastify";
import { validatePromoCode } from "../services/promoCodes.js";
import { emailSchema } from "../schemas/email/schema.js";
import { prisma } from "../lib/prisma.js";
import { PurchaseRequestBody } from "../types/index.js";

export function purchaseRoutes(fastify: FastifyInstance) {
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
        payed: false,
      },
    });

    const currentOrder = await prisma.order.findUnique({
      where: {
        id: createdOrder.id,
      },
    });

    //ОТРИМАЛИ ОПЛАТУ -
    // 1- ПОКАЗУЄМО ВІКНО УСПІШНОЇ ОПЛАТИ
    // 2- ПЕРЕВОДИМО КОД ПРОМОКОДУ В СТАТУС ВИКОРИСТАНОГО
    // 3- ВІДПРАВЛЯЄМО ПОВІДОМЛЕННЯ НА ПОШТУ ПРО ПРОДАЖ ТОВАРУ ІНФОРМАЦІЮ ПРО ЗАМОВЛЕННЯ

    return currentOrder;
  });
}
