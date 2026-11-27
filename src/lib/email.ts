import { Resend } from "resend";

// Sender address. Set RESEND_FROM to a verified domain address in production.
const DEFAULT_FROM = "SQL Quest <onboarding@resend.dev>";

let client: Resend | null = null;

function getClient() {
  if (!client) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY is not set.");
    client = new Resend(apiKey);
  }
  return client;
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const { data, error } = await getClient().emails.send({
    from: process.env.RESEND_FROM ?? DEFAULT_FROM,
    to: [input.to],
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  if (error) throw new Error(`Email send failed: ${error.message}`);
  return data;
}
