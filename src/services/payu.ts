import { PayUAuthResponse, PayUCreatePaymentResponse } from "../types/payU.js";

const PAYU_BASE = "https://secure.snd.payu.com";

const client_id = process.env.PAYU_CLIENT_ID!;
const client_secret = process.env.PAYU_CLIENT_SECRET!;

const BACKEND_URL = "https://dusti-eudiometrical-divaricately.ngrok-free.dev";

export async function getAccessToken() {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id,
    client_secret,
  });

  const res = await fetch(`${PAYU_BASE}/pl/standard/user/oauth/authorize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("OAuth error:", data);
    throw new Error("PAYU_AUTH_ERROR");
  }

  if (!isPayUAuthResponse(data)) {
    throw new Error("Invalid PayU response");
  }

  return data.access_token;
}

export async function createPayUPaymentURL({
  amount,
  email,
  orderId,
  customerIp,
}: {
  amount: number;
  email: string;
  orderId: string;
  customerIp: string;
}): Promise<string> {
  const token = await getAccessToken();

  const res = await fetch(`${PAYU_BASE}/api/v2_1/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      notifyUrl: `${BACKEND_URL}/webhook/payu`,
      continueUrl: `http://localhost:5173/cart/?order=${orderId}`,
      customerIp,
      merchantPosId: "300746",
      description: `Zamówienie #${orderId}`,
      currencyCode: "PLN",
      totalAmount: amount.toString(),
      extOrderId: `${orderId}_${Date.now()}`,
      products: [
        {
          name: "Zamówienie",
          unitPrice: amount.toString(),
          quantity: "1",
        },
      ],
      buyer: {
        email,
        firstName: "Jan",
        lastName: "Kowalski",
        language: "pl",
      },
    }),

    redirect: "manual",
  });

  if (res.status === 302) {
    const redirectUri = res.headers.get("location");
    if (!redirectUri) {
      throw new Error("No Location header in 302 response");
    }
    return redirectUri;
  }

  const data = await res.json();

  if (!res.ok) {
    console.error("PayU error:", JSON.stringify(data, null, 2));
    throw new Error("PAYU_CREATE_ORDER_ERROR");
  }

  if (!isPayUACreatePaymentResponse(data)) {
    throw new Error("Invalid PayU response");
  }

  return data.redirectUri;
}

function isPayUAuthResponse(data: any): data is PayUAuthResponse {
  return data && typeof data.access_token === "string";
}

function isPayUACreatePaymentResponse(
  data: any,
): data is PayUCreatePaymentResponse {
  return data && typeof data.redirectUri === "string";
}
