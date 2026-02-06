import { FastifyPluginAsync } from "fastify";
import { validatePromoCode } from "../services/promoCodes.js";

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
};

export default promoCodesRoutes;
