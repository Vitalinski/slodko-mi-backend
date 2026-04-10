import Fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";

import productsRoutes from "./routes/products.js";
import categoriesRoutes from "./routes/categories.js";
import ordersRoutes from "./routes/orders.js";
import subscribeRoutes from "./routes/subscribe.js";
import promoCodesRoutes from "./routes/promoCodes.js";
import purchaseRoutes from "./routes/purchase.js";
import fastifyMultipart from "@fastify/multipart";
import webhookRoutes from "./routes/webhookPayU.js";

dotenv.config();

const fastify = Fastify({
  logger:
    process.env.NODE_ENV === "production"
      ? true
      : {
          transport: {
            target: "pino-pretty",
          },
        },
});

await fastify.register(cors, {
  origin: process.env.FRONTEND_ORIGIN?.split(","),
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
});

fastify.register(fastifyMultipart, {
  attachFieldsToBody: true,
  limits: { fileSize: 10 * 1024 * 1024 },
});
fastify.get("/", async () => {
  return { message: "Port is working good!" };
});

fastify.register(productsRoutes);
fastify.register(categoriesRoutes);
fastify.register(subscribeRoutes);
fastify.register(promoCodesRoutes);
fastify.register(purchaseRoutes);
fastify.register(webhookRoutes);
fastify.register(ordersRoutes);

const port = Number(process.env.PORT) || 3000;

try {
  await fastify.listen({ port, host: "0.0.0.0" });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
