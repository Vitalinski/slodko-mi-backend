import { FastifyRequest } from "fastify";

export function getIpAddress(request: FastifyRequest): string  {
  return (
    request.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
    request.headers["x-real-ip"]?.toString() ||
    request.ip ||
    "1.1.1.1"
  );
}
