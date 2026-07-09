import twilio from 'twilio';
import { env } from '../../../config/env.js';
import { normalizeWhatsappNumber } from '../../../utils/whatsappNumber.js';

function isTwilioWebhook(req) {
  return Boolean(req.body.MessageSid || req.body.SmsMessageSid || req.body.WaId || req.body.ProfileName);
}

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export const twilioProvider = {
  name: 'twilio',

  canHandleInbound(req) {
    return isTwilioWebhook(req);
  },

  extractInboundMessage(req) {
    return {
      provider: 'twilio',
      from: normalizeWhatsappNumber(req.body.From),
      body: req.body.Body,
      messageId: req.body.MessageSid || req.body.SmsMessageSid || null,
      profileName: req.body.ProfileName || 'WhatsApp User',
      responseMode: 'twiml',
      shouldAutoCreateUser: true
    };
  },

  buildWebhookResponse(payload) {
    return {
      type: 'xml',
      body: `<Response><Message>${escapeXml(payload.reply || '')}</Message></Response>`
    };
  },

  async sendMessage(to, body) {
    if (!env.twilioAccountSid || !env.twilioAuthToken || !env.twilioWhatsappFrom) {
      console.log(`[whatsapp:twilio:mock] to=${to} body=${body}`);
      return { mocked: true, provider: 'twilio', to, body };
    }

    const client = twilio(env.twilioAccountSid, env.twilioAuthToken);
    return client.messages.create({
      from: env.twilioWhatsappFrom,
      to,
      body
    });
  }
};
