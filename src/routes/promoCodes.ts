import { FastifyPluginAsync } from "fastify";
import { validatePromoCode, validateToken } from "../services/promoCodes.js";

const promoCodesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get("/promo/validate", async (request, reply) => {
    const { code } = request.query as { code: string };

    const result = await validatePromoCode(code);

    if (!result.valid) {
      return reply.status(400).send({
        error: { code: result.errorCode },
      });
    }

    return { ok: true, discount: result.discount };
  });

 fastify.get("/token/validate", async (request, reply) => {
    const { token } = request.query as { token: string };

    const result = await validateToken(token);

    if (!result.valid) {
      return reply.status(400).send({
        error: { code: result.errorCode },
      });
    }

    return { ok: true, promoCode: result.promoCode };
  });

};

export default promoCodesRoutes;
