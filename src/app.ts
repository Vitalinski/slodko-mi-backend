import Fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";
import { productsRoutes } from "./routes/products.js";
import { categoriesRoutes } from "./routes/categories.js";
import { subscribeRoutes } from "./routes/subscribe.js";
import { promoCodesRoutes } from "./routes/promoCodes.js";
import { purchaseRoutes } from "./routes/purchase.js";
dotenv.config();

const PORT = Number(process.env.PORT);
const HOST = process.env.HOST;

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

async function bootstrap() {
  await fastify.register(cors, {
    origin: process.env.FRONTEND_ORIGIN,
    credentials: true,
  });
}

bootstrap();

fastify.get("/", () => {
  return {
    message: "Port is working good!",
  };
});

try {
  fastify.listen({ port: PORT || 3000, host: HOST || "0.0.0.0" });
} catch (e) {
  fastify.log.error(e, "ERROR HERE");
  process.exit(1);
}

fastify.register(productsRoutes);
fastify.register(categoriesRoutes);
fastify.register(subscribeRoutes);
fastify.register(promoCodesRoutes);
fastify.register(purchaseRoutes);
