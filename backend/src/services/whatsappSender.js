import { getConfiguredWhatsAppProvider } from './whatsapp/provider.js';

export async function sendWhatsAppMessage(to, body) {
  return getConfiguredWhatsAppProvider().sendMessage(to, body);
}

export function formatCurrency(value) {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
