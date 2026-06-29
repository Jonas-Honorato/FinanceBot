import twilio from 'twilio';
import { env } from '../config/env.js';

export async function sendWhatsAppMessage(to, body) {
  if (!env.twilioAccountSid || !env.twilioAuthToken || !env.twilioWhatsappFrom) {
    console.log(`[whatsapp:mock] to=${to} body=${body}`);
    return { mocked: true };
  }

  const client = twilio(env.twilioAccountSid, env.twilioAuthToken);
  return client.messages.create({
    from: env.twilioWhatsappFrom,
    to,
    body
  });
}

export function formatCurrency(value) {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
