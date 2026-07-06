import { CATEGORIES, CATEGORY_KEYWORDS } from '../config/categories.js';
import { todayISO } from '../utils/date.js';

const COMMANDS = ['resumo', 'hoje', 'relatório', 'relatorio'];
const HELP_COMMANDS = ['ajuda', 'comandos', 'menu', 'help'];
const INCOME_WORDS = ['recebi', 'ganhei', 'entrou', 'caiu', 'salario', 'salÃ¡rio', 'freela', 'freelance', 'reembolso', 'bonus', 'bÃ´nus'];
const LAST_COMMANDS = ['ultimos', 'últimos', 'ultimas', 'últimas', 'extrato'];
const DELETE_LAST_COMMANDS = ['apagar ultimo', 'apagar último', 'deletar ultimo', 'deletar último', 'excluir ultimo', 'excluir último', 'desfazer'];
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
const MONTH_NAMES = {
  janeiro: 1,
  fevereiro: 2,
  marco: 3,
  abril: 4,
  maio: 5,
  junho: 6,
  julho: 7,
  agosto: 8,
  setembro: 9,
  outubro: 10,
  novembro: 11,
  dezembro: 12
};

function addMonthsISO(baseDate, months) {
  const date = new Date(`${baseDate}T00:00:00.000Z`);
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString().slice(0, 10);
}

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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasKeyword(normalizedMessage, keyword) {
  const normalizedKeyword = normalizeText(keyword);
  const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(normalizedKeyword)}([^a-z0-9]|$)`, 'i');
  return pattern.test(normalizedMessage);
}

function inferCategory(message) {
  const normalized = normalizeText(message);

  if (INCOME_WORDS.some((word) => hasKeyword(normalized, word))) {
    return hasKeyword(normalized, 'salario') ? 'SalÃ¡rio' : 'Receita';
  }

  for (const category of CATEGORIES) {
    if (normalizeText(category) === normalized || normalized.includes(normalizeText(category))) {
      return category;
    }
  }

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => hasKeyword(normalized, keyword))) {
      return category;
    }
  }

  return 'Outros';
}

function cleanDescription(message, amountRaw) {
  return message
    .replace(amountRaw, '')
    .replace(/\b(gastei|paguei|comprei|recebi|ganhei|entrou|caiu|no|na|em|com|de|para)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function inferTransactionType(message) {
  const normalized = normalizeText(message);
  return INCOME_WORDS.some((word) => hasKeyword(normalized, word)) ? 'income' : 'expense';
}

function parsePeriodSummary(normalized, baseDate) {
  const year = new Date(`${baseDate}T00:00:00.000Z`).getUTCFullYear();

  if (/^(resumo|relatorio|relatório)\s+(da\s+)?semana(l)?$/.test(normalized)) {
    return { ok: true, type: 'period-summary', period: 'week', command: normalized };
  }

  const monthMatch = normalized.match(/^(resumo|relatorio|relatório)\s+(de\s+)?([a-z]+)(?:\s+(\d{4}))?$/);
  if (monthMatch && MONTH_NAMES[monthMatch[3]]) {
    return {
      ok: true,
      type: 'period-summary',
      period: 'month',
      month: MONTH_NAMES[monthMatch[3]],
      year: monthMatch[4] ? Number(monthMatch[4]) : year,
      command: normalized
    };
  }

  return null;
}

export function parseWhatsAppMessage(message, baseDate = todayISO()) {
  if (!message || typeof message !== 'string') {
    return { ok: false, type: 'error', message: 'Envie uma mensagem de texto com valor e descrição.' };
  }

  const trimmed = message.trim();
  const normalized = normalizeText(trimmed);

  if (HELP_COMMANDS.includes(normalized)) {
    return { ok: true, type: 'help', command: normalized };
  }

  if (LAST_COMMANDS.includes(normalized)) {
    return { ok: true, type: 'last-transactions', command: normalized };
  }

  if (DELETE_LAST_COMMANDS.includes(normalized)) {
    return { ok: true, type: 'delete-last-transaction', command: normalized };
  }

  const correctLastCommand = normalized.match(/^corrigir\s+ultim[oa]\s+(?:para\s+)?(.+)$/);
  if (correctLastCommand) {
    return { ok: true, type: 'correct-last-category', category: inferCategory(correctLastCommand[1]) };
  }

  if (PERIOD_COMMANDS.includes(normalized)) {
    return { ok: true, type: 'period', command: normalized };
  }

  const periodSummary = parsePeriodSummary(normalized, baseDate);
  if (periodSummary) {
    return periodSummary;
  }

  if (normalized === 'metas' || normalized === 'minhas metas' || normalized.includes('quanto falta para minha meta')) {
    return { ok: true, type: 'goals-summary', command: normalized };
  }

  if (
    normalized.includes('quanto posso gastar') ||
    normalized.includes('quanto ainda posso gastar') ||
    normalized.includes('posso gastar essa semana') ||
    normalized.includes('limite da semana') ||
    normalized.includes('limite semanal') ||
    normalized.includes('disponivel no mes')
  ) {
    return {
      ok: true,
      type: 'spending-plan',
      period: normalized.includes('semana') || normalized.includes('semanal') ? 'week' : 'month',
      command: normalized
    };
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

  const goalCommand = normalized.match(/^(?:quero\s+)?(?:juntar|guardar|economizar)\s+(.+)$/);
  if (goalCommand) {
    const amount = parseAmount(goalCommand[1]);
    const monthsMatch = normalized.match(/\bem\s+(\d{1,2})\s+m[eê]s(?:es)?\b/);

    if (!amount) {
      return { ok: false, type: 'error', message: 'Nao consegui identificar o valor da meta. Exemplo: "quero juntar 3000 em 6 meses".' };
    }

    if (!monthsMatch) {
      return { ok: false, type: 'error', message: 'Nao consegui identificar o prazo da meta. Exemplo: "quero juntar 3000 em 6 meses".' };
    }

    const months = Number(monthsMatch[1]);
    return {
      ok: true,
      type: 'goal',
      title: 'Meta financeira',
      amount: amount.value,
      months,
      deadline: addMonthsISO(baseDate, months)
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
  const transactionType = inferTransactionType(trimmed);

  return {
    ok: true,
    type: 'transaction',
    transactionType,
    amount: amount.value,
    category,
    description: description || category,
    date: baseDate,
    createdVia: 'whatsapp'
  };
}
