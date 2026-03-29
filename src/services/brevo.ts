const BREVO_BASE_URL = "https://api.brevo.com/v3";

export async function createBrevoContact(
  email: string,
  promoCode: string,
  token: string,
) {
  const response = await fetch(`${BREVO_BASE_URL}/contacts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": process.env.BREVO_API_KEY!,
      accept: "application/json",
    },
    body: JSON.stringify({
      email,
      ext_id: promoCode,
      attributes: {
        JOB_TITLE: token,
      },
      listIds: [7],
      updateEnabled: true,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Brevo error: ${response.status} ${text}`);
  }
}
