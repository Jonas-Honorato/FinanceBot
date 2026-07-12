const WHATSAPP_PREFIX = 'whatsapp:';
const DEFAULT_COUNTRY_CODE = '55';

export function normalizeWhatsappNumber(value) {
  if (!value) return null;

  const raw = String(value).trim();
  if (!raw) return null;

  const hasExplicitInternationalPrefix = raw.includes('+') || raw.toLowerCase().startsWith(`${WHATSAPP_PREFIX}+`);
  let digits = raw.replace(/\D/g, '');

  if (!digits) return null;
  if (digits.startsWith('00')) digits = digits.slice(2);

  const looksLikeBrazilianLocal = digits.length === 10 || digits.length === 11;
  if (!hasExplicitInternationalPrefix && !digits.startsWith(DEFAULT_COUNTRY_CODE) && looksLikeBrazilianLocal) {
    digits = `${DEFAULT_COUNTRY_CODE}${digits}`;
  }

  const isLegacyBrazilianMobile =
    digits.startsWith(DEFAULT_COUNTRY_CODE) &&
    digits.length === 12 &&
    /^[6-9]$/.test(digits[4]);

  if (isLegacyBrazilianMobile) {
    digits = `${digits.slice(0, 4)}9${digits.slice(4)}`;
  }

  return `${WHATSAPP_PREFIX}+${digits}`;
}

export function whatsappNumberToMetaRecipient(value) {
  return normalizeWhatsappNumber(value)?.replace(WHATSAPP_PREFIX, '').replace(/\D/g, '') || '';
}
