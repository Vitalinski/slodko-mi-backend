import { prisma } from "../lib/prisma.js";
import { addPromoCode } from "./promoCodes.js";

export async function subscribeWithPromo(email: string, consentIp: string|null) {
  const result = await prisma.$transaction(async (tx) => {
    await tx.subscriber.create({
      data: {
        email,
        consentIp:consentIp??'IP NOT FOUND',
        consentText:
          "Wyrażam zgodę na otrzymywanie informacji marketingowych, ofert oraz kodów promocyjnych na podany adres e-mail. Zgodę mogę w każdej chwili wycofać. Zapoznałem(-am) się z Polityką prywatności.",
      },
    });

    return addPromoCode(email);
  });

  return result;
}
