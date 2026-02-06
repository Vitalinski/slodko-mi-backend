import { prisma } from "../lib/prisma.js";
import { addPromoCode } from "./promoCodes.js";

export async function subscribeWithPromo(email: string) {
  return prisma.$transaction(async (tx) => {
    await tx.subscriber.create({ data: { email } });

    const promoCode = await addPromoCode(email);

    return promoCode;
  });
}
