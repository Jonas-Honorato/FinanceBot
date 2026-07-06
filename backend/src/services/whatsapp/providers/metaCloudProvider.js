import { env } from '../../../config/env.js';

function firstMetaValue(req) {
  return req.body?.entry?.[0]?.changes?.[0]?.value || null;
}

function normalizeMetaPhone(value) {
  if (!value) return null;
  const digits = String(value).replace(/\D/g, '');
  return digits ? `whatsapp:+${digits}` : null;
}

export const metaCloudProvider = {
  name: 'meta',

  canHandleInbound(req) {
    return Boolean(firstMetaValue(req)?.messages?.[0]);
  },

  extractInboundMessage(req) {
    const value = firstMetaValue(req);
    const message = value?.messages?.[0] || {};
    const contact = value?.contacts?.[0] || {};
    const text = message.text?.body || message.button?.text || message.interactive?.button_reply?.title || '';

    return {
      provider: 'meta',
      from: normalizeMetaPhone(message.from),
      body: text,
      messageId: message.id || null,
      profileName: contact.profile?.name || 'WhatsApp User',
      responseMode: 'json',
      shouldAutoCreateUser: true
    };
  },

  buildWebhookResponse(payload) {
    return { type: 'json', body: payload };
  },

  async sendMessage(to, body) {
    if (!env.metaWhatsappToken || !env.metaPhoneNumberId) {
      console.log(`[whatsapp:meta:mock] to=${to} body=${body}`);
      return { mocked: true, provider: 'meta', to, body };
    }

    const recipient = String(to).replace(/^whatsapp:/, '').replace(/\D/g, '');
    const response = await fetch(
      `https://graph.facebook.com/${env.metaGraphApiVersion}/${env.metaPhoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.metaWhatsappToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: recipient,
          type: 'text',
          text: { preview_url: false, body }
        })
      }
    );

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = payload.error?.message || `Meta Cloud API returned ${response.status}`;
      throw new Error(message);
    }

    return payload;
  }
};
