import { prisma } from "../lib/prisma.js";
import { nanoid } from "nanoid";
const PROMO_CODE_LENGTH = 8
const TOKEN_LENGTH = 10


export async function addPromoCode(email: string) {
  const code = generateCode(PROMO_CODE_LENGTH);
  const token = generateCode(TOKEN_LENGTH);

  await prisma.promoCode.create({
    data: {
      email,
      code,
      token,
    },
  });

  return { code, token };
}

export function generateCode(length: number) {
  return nanoid(length).toUpperCase();
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

export async function validateToken(token: string) {
  if (!token || token.length !== 10) {
    return { valid: false as const, errorCode: "INVALID_TOKEN" };
  }

  const promo = await prisma.promoCode.findUnique({
    where: { token },
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
    promoCode: promo.code,
  };
}
