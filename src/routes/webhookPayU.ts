import { FastifyPluginAsync } from "fastify";
import { prisma } from "../lib/prisma.js";
import crypto from "crypto";

const PAYU_SECOND_KEY = process.env.PAYU_SECOND_KEY!;

const webhookRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addContentTypeParser(
    "application/json",
    { parseAs: "string" },
    (_, body, done) => {
      done(null, body);
    },
  );

  fastify.post("/webhook/payu", async (request, reply) => {
    const rawBody = request.body as string;
    let parsedBody: any;
    try {
      parsedBody = JSON.parse(rawBody);
    } catch (e) {
      console.error("Invalid JSON in webhook");
      return reply.status(400).send("Invalid JSON");
    }

    console.log("PAYU WEBHOOK received:", {
      extOrderId: parsedBody?.order?.extOrderId,
      status: parsedBody?.order?.status,
    });

    const signatureHeader = request.headers["openpayu-signature"] as
      | string
      | undefined;

    if (!verifyPayUSignature(rawBody, signatureHeader, PAYU_SECOND_KEY)) {
      console.error("Invalid PayU signature!");
      return reply.status(401).send("Invalid signature");
    }

    const extOrderId = parsedBody?.order?.extOrderId;
    const payuStatus = parsedBody?.order?.status?.toUpperCase();

    if (!extOrderId || !payuStatus) {
      return reply.status(400).send("Missing data");
    }

    const originalOrderId = extOrderId.split("_")[0];
    const newStatus = mapPayUStatusToOrderStatus(payuStatus);

    try {
      await prisma.order.update({
        where: { id: originalOrderId },
        data: { status: newStatus },
      });
      console.log(
        `Order ${originalOrderId} updated to ${newStatus}, payU status is ${payuStatus}`,
      );
    } catch (error: any) {
      console.error("Update error:", error);
      if (error.code === "P2025")
        return reply.status(404).send("Order not found");
    }

    return reply.status(200).send("OK");
  });
};

function verifyPayUSignature(
  rawBody: string,
  signatureHeader: string | undefined,
  secondKey: string,
): boolean {
  if (!signatureHeader || !rawBody || !secondKey) return false;

  const parts = signatureHeader.split(";").reduce((acc: any, p) => {
    const [k, v] = p.trim().split("=");
    if (k && v) acc[k.trim()] = v.trim();
    return acc;
  }, {});

  const receivedSig = parts.signature;
  if (!receivedSig) return false;

  const algo = (parts.algorithm || "MD5").toLowerCase();

  const hash = crypto.createHash(algo === "md5" ? "md5" : "sha256");
  const calculated = hash.update(rawBody + secondKey).digest("hex");

  return calculated === receivedSig;
}

function mapPayUStatusToOrderStatus(payuStatus: string) {
  switch (payuStatus) {
    case "COMPLETED":
    case "SUCCESS":
    case "WAITING_FOR_CONFIRMATION":
      return "COMPLETED";
    case "CANCELED":
      return "CANCELED";
    default:
      return "PENDING";
  }
}

export default webhookRoutes;
