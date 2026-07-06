import { env } from '../../config/env.js';
import { metaCloudProvider } from './providers/metaCloudProvider.js';
import { mockProvider } from './providers/mockProvider.js';
import { twilioProvider } from './providers/twilioProvider.js';

const providers = {
  meta: metaCloudProvider,
  'meta-cloud': metaCloudProvider,
  mock: mockProvider,
  twilio: twilioProvider
};

export function getConfiguredWhatsAppProvider() {
  return providers[env.whatsappProvider] || mockProvider;
}

export function getInboundWhatsAppProvider(req) {
  return [twilioProvider, metaCloudProvider].find((provider) => provider.canHandleInbound(req)) || mockProvider;
}

export function buildWhatsAppWebhookResponse(provider, payload) {
  return provider.buildWebhookResponse(payload);
}
