import { prisma } from "../lib/prisma.js";

export async function createSubscriber(email: string) {
  return prisma.subscriber.create({
    data: { email },
  });
}
