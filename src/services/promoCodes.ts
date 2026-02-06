// services/promoCodes.ts
import { prisma } from "../lib/prisma.js";
import { nanoid } from "nanoid";

export function generatePromoCode() {
  return nanoid(8).toUpperCase();
}

export async function addPromoCode(email: string) {
  const code = generatePromoCode();

  await prisma.promoCode.create({
    data: {
      email,
      code,
    },
  });

  return code;
}

export async function validatePromoCode(code: string) {
  if (!code || code.length !== 8) {
    return { valid: false as const, errorCode: "INVALID_PROMO_CODE" };
  }

  const promo = await prisma.promoCode.findUnique({
    where: { code },
  });
  if (!promo) {
    return {
      valid: false as const,
      errorCode: "PROMO_CODE_NOT_FOUND",
    };
  }

  if (promo.used) {
    return {
      valid: false as const,
      errorCode: "PROMO_CODE_ALREADY_USED",
    };
  }

  return {
    valid: true as const,
    discount: promo.discount,
  };
}
