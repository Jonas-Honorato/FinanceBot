import { env } from '../../../config/env.js';
import { normalizeWhatsappNumber, whatsappNumberToMetaRecipient } from '../../../utils/whatsappNumber.js';

function firstMetaValue(req) {
  return req.body?.entry?.[0]?.changes?.[0]?.value || null;
}

export const metaCloudProvider = {
  name: 'meta',

  canHandleInbound(req) {
    return Boolean(firstMetaValue(req));
  },

  extractInboundMessage(req) {
    const value = firstMetaValue(req);
    const message = value?.messages?.[0] || {};
    const contact = value?.contacts?.[0] || {};
    const text = message.text?.body || message.button?.text || message.interactive?.button_reply?.title || '';

    return {
      provider: 'meta',
      from: normalizeWhatsappNumber(message.from),
      body: text,
      messageId: message.id || null,
      profileName: contact.profile?.name || 'WhatsApp User',
      responseMode: 'json',
      shouldAutoCreateUser: true
    };
  },

  extractDeliveryStatuses(req) {
    const statuses = firstMetaValue(req)?.statuses;
    if (!Array.isArray(statuses)) return [];

    return statuses.map((status) => ({
      messageId: status.id || null,
      status: status.status || 'unknown',
      timestamp: status.timestamp || null,
      errors: Array.isArray(status.errors)
        ? status.errors.map((error) => ({
            code: error.code || null,
            title: error.title || null,
            message: error.message || null,
            details: error.error_data?.details || null
          }))
        : []
    }));
  },

  buildWebhookResponse(payload) {
    return { type: 'json', body: payload };
  },

  async sendMessage(to, body) {
    if (!env.metaWhatsappToken || !env.metaPhoneNumberId) {
      throw new Error('Meta WhatsApp Cloud API is not configured. Set META_WHATSAPP_TOKEN and META_PHONE_NUMBER_ID.');
    }

    const recipient = whatsappNumberToMetaRecipient(to);
    if (!recipient) {
      throw new Error('Invalid WhatsApp recipient number.');
    }

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
