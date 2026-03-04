import { prisma } from "../lib/prisma.js";
import { addPromoCode } from "./promoCodes.js";

export async function subscribeWithPromo(email: string) {
  const result = await prisma.$transaction(async (tx) => {
    await tx.subscriber.create({ data: { email } });

    return addPromoCode(email);
  });

  return result;
}

export async function createSubscriber(email: string) {
  return prisma.subscriber.create({
    data: { email },
  });
}
