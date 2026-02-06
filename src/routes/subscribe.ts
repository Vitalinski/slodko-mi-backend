import { FastifyPluginAsync } from "fastify";
import { Prisma } from "@prisma/client";
import { emailSchema } from "../schemas/email/schema.js";
import { subscribeWithPromo } from "../services/subscribeFlow.js";
import { createBrevoContact } from "../services/brevo.js";

const subscribeRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post("/subscribe", async (request, reply) => {
    const parsed = emailSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: "INVALID_EMAIL" },
      });
    }

    const { email } = parsed.data;

    let promoCode: string;

    try {
      promoCode = await subscribeWithPromo(email);
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
      await createBrevoContact(email, promoCode);
    } catch (err) {
      request.log.error(err, "Brevo failed");
    }

    return reply.status(200).send({
      ok: true,
      promoCode,
    });
  });
}
export default subscribeRoutes;