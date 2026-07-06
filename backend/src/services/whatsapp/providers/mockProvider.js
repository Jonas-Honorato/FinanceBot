export const mockProvider = {
  name: 'mock',

  canHandleInbound() {
    return false;
  },

  extractInboundMessage(req) {
    return {
      provider: 'mock',
      from: req.body.From || req.body.from || req.body.whatsappNumber,
      body: req.body.Body || req.body.body || req.body.message,
      messageId: req.body.messageId || null,
      profileName: req.body.profileName || 'WhatsApp User',
      responseMode: 'outbound',
      shouldAutoCreateUser: false
    };
  },

  buildWebhookResponse(payload) {
    return { type: 'json', body: payload };
  },

  async sendMessage(to, body) {
    console.log(`[whatsapp:mock] to=${to} body=${body}`);
    return { mocked: true, to, body };
  }
};
