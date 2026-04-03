import { FastifyPluginAsync, FastifyRequest } from "fastify";
import { Prisma } from "@prisma/client";
import { emailSchema } from "../schemas/email/schema.js";
import { subscribeWithPromo } from "../services/subscribeFlow.js";
import { createBrevoContact } from "../services/brevo.js";
import { getIpAddress } from "../utils/getIpAddress.js";

const subscribeRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post("/subscribe", async (request: FastifyRequest, reply) => {
    const parsed = emailSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: "INVALID_EMAIL" },
      });
    }

    const { email } = parsed.data;

    const ipAddress = getIpAddress(request);

    let promoCode: string;
    let token: string;

    try {
      const codes = await subscribeWithPromo(email, ipAddress);
      promoCode = codes.code;
      token = codes.token;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2002") {
          return reply.status(409).send({
            error: { code: "EMAIL_ALREADY_SUBSCRIBED" },
          });
        }
      }

      request.log.error(err);
      return reply.status(500).send({
        error: { code: "INTERNAL_ERROR" },
      });
    }

    try {
      await createBrevoContact(email, promoCode, token);
    } catch (err) {
      request.log.error(err, "Brevo failed");
      return reply.status(500).send({
        error: { code: "INTERNAL_ERROR" },
      });
    }

    return reply.status(200).send({
      ok: true,
    });
  });
};
export default subscribeRoutes;
