import { CATEGORIES, CATEGORY_KEYWORDS } from '../config/categories.js';
import { todayISO } from '../utils/date.js';

const COMMANDS = ['resumo', 'hoje', 'relatório', 'relatorio'];
const PERIOD_COMMANDS = [
  'periodo',
  'período',
  'competencia',
  'competência',
  'mes',
  'mês',
  'inicio',
  'início',
  'quando começou',
  'quando comecou',
  'quando começa',
  'quando comeca',
  'desde quando'
];

function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim();
}

function parseAmount(message) {
  const amountMatch = message.match(/(?:r\$\s*)?(\d{1,3}(?:\.\d{3})+|\d+)(?:[,.](\d{1,2}))?\s*(?:reais|real)?/i);
  if (!amountMatch) return null;

  const integerPart = amountMatch[1].replace(/\./g, '');
  const cents = amountMatch[2] ? amountMatch[2].padEnd(2, '0') : '00';
  return {
    raw: amountMatch[0],
    value: Number(`${integerPart}.${cents}`)
  };
}

function inferCategory(message) {
  const normalized = normalizeText(message);

  for (const category of CATEGORIES) {
    if (normalizeText(category) === normalized || normalized.includes(normalizeText(category))) {
      return category;
    }
  }

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => normalized.includes(normalizeText(keyword)))) {
      return category;
    }
  }

  return 'Outros';
}

function cleanDescription(message, amountRaw) {
  return message
    .replace(amountRaw, '')
    .replace(/\b(gastei|paguei|comprei|no|na|em|com|de|para)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseWhatsAppMessage(message, baseDate = todayISO()) {
  if (!message || typeof message !== 'string') {
    return { ok: false, type: 'error', message: 'Envie uma mensagem de texto com valor e descrição.' };
  }

  const trimmed = message.trim();
  const normalized = normalizeText(trimmed);

  if (PERIOD_COMMANDS.includes(normalized)) {
    return { ok: true, type: 'period', command: normalized };
  }

  if (COMMANDS.map(normalizeText).includes(normalized)) {
    return { ok: true, type: normalized.startsWith('relatorio') ? 'report' : normalized, command: normalized };
  }

  const categoryCommand = normalized.match(/^categoria\s+(.+)$/);
  if (categoryCommand) {
    return { ok: true, type: 'category-summary', category: inferCategory(categoryCommand[1]) };
  }

  const budgetCommand = normalized.match(/^meta\s+(.+)$/);
  if (budgetCommand) {
    const amount = parseAmount(budgetCommand[1]);
    if (!amount) {
      return { ok: false, type: 'error', message: 'Não consegui identificar o valor da meta.' };
    }
    const categoryText = budgetCommand[1].replace(amount.raw, '').trim();
    return {
      ok: true,
      type: 'budget',
      amount: amount.value,
      category: inferCategory(categoryText || 'Outros')
    };
  }

  const amount = parseAmount(trimmed);
  if (!amount || !Number.isFinite(amount.value) || amount.value <= 0) {
    return {
      ok: false,
      type: 'error',
      message: 'Não consegui identificar o valor. Exemplo: "Uber 22 transporte" ou "Gastei R$45 no mercado".'
    };
  }

  const description = cleanDescription(trimmed, amount.raw);
  const category = inferCategory(trimmed);

  return {
    ok: true,
    type: 'transaction',
    amount: amount.value,
    category,
    description: description || category,
    date: baseDate,
    createdVia: 'whatsapp'
  };
}
