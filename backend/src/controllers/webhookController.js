import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { query } from '../db/pool.js';
import { buildSpendingPlan } from '../services/spendingPlanService.js';
import { parseWhatsAppMessage } from '../services/whatsappParser.js';
import { formatCurrency, sendWhatsAppMessage } from '../services/whatsappSender.js';
import { buildWhatsAppWebhookResponse, getInboundWhatsAppProvider } from '../services/whatsapp/provider.js';
import { formatDateBR, getMonthBounds, todayISO } from '../utils/date.js';
import { normalizeWhatsappNumber } from '../utils/whatsappNumber.js';

function sendWebhookReply(provider, res, payload) {
  const response = buildWhatsAppWebhookResponse(provider, payload);
  if (response.type === 'xml') {
    return res.type('text/xml').send(response.body);
  }
  return res.json(response.body);
}

async function findUserByWhatsapp(number) {
  const { rows } = await query('SELECT id, name, whatsapp_number FROM users WHERE whatsapp_number = $1', [normalizeWhatsappNumber(number)]);
  return rows[0];
}

async function createWhatsappUser(number, name = 'WhatsApp User') {
  const whatsappNumber = normalizeWhatsappNumber(number);
  const normalized = String(whatsappNumber).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const email = `${normalized}@whatsapp.financebot.local`;
  const passwordHash = await bcrypt.hash(crypto.randomUUID(), 10);

  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash, whatsapp_number)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (whatsapp_number)
     DO UPDATE SET whatsapp_number = EXCLUDED.whatsapp_number
     RETURNING id, name, email, whatsapp_number`,
    [name || 'WhatsApp User', email, passwordHash, whatsappNumber]
  );

  return rows[0];
}

async function sendOutboundReply(inbound, to, reply) {
  if (inbound.responseMode === 'twiml' || !to || !reply) return;

  try {
    const result = await sendWhatsAppMessage(to, reply);
    const messageIds = Array.isArray(result?.messages)
      ? result.messages.map((message) => message.id).filter(Boolean)
      : [];
    console.info(
      `[whatsapp:${inbound.provider}:send_accepted]`,
      JSON.stringify({ messageIds })
    );
    return result;
  } catch (error) {
    console.error(
      `[whatsapp:${inbound.provider}:send_error]`,
      error instanceof Error ? error.message : String(error)
    );
  }
}

function logDeliveryStatuses(provider, req) {
  const statuses = provider.extractDeliveryStatuses?.(req) || [];

  for (const delivery of statuses) {
    console.info(
      `[whatsapp:${provider.name}:delivery_status]`,
      JSON.stringify(delivery)
    );
  }

  return statuses;
}

function buildHelpMessage() {
  return [
    'Comandos do FinanceBot:',
    'Registrar gasto: "sushi 25" ou "gastei R$45 no mercado".',
    'Últimos gastos: ultimos.',
    'Apagar último gasto: apagar ultimo.',
    'Corrigir categoria do último: corrigir ultimo alimentacao.',
    'Resumo do mês: resumo.',
    'Análise mensal: relatorio.',
    'Gastos de hoje: hoje.',
    'Período da contagem: periodo.',
    'Categoria específica: categoria alimentacao.',
    'Definir meta: meta 1000 alimentacao.',
    'Criar meta financeira: quero juntar 3000 em 6 meses.',
    'Ver metas financeiras: minhas metas.',
    'Limite de gasto: quanto posso gastar essa semana?',
    'Ver comandos: ajuda.'
  ].join('\n');
}

function formatTransactionLine(transaction, index = null) {
  const prefix = index === null ? '' : `${index}. `;
  const label = transaction.type === 'income' ? 'receita' : 'gasto';
  return `${prefix}${formatDateBR(transaction.date)} - ${formatCurrency(transaction.amount)} em ${transaction.category} (${label}: ${transaction.description || 'sem descrição'})`;
}

function buildPeriodInfo() {
  const bounds = getMonthBounds();
  return `Estou contando os gastos deste mês de ${formatDateBR(bounds.start)} até ${formatDateBR(bounds.displayEnd)}. O mês atual é ${String(bounds.month).padStart(2, '0')}/${bounds.year}.`;
}

function monthlyRequired(targetAmount, currentAmount, months) {
  const remaining = Math.max(0, Number(targetAmount) - Number(currentAmount || 0));
  return Number((remaining / Math.max(1, Number(months || 1))).toFixed(2));
}

function addDaysISO(dateISO, days) {
  const date = new Date(`${dateISO}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function getWeekBounds(dateISO = todayISO()) {
  const date = new Date(`${dateISO}T00:00:00.000Z`);
  const day = date.getUTCDay();
  const daysSinceMonday = (day + 6) % 7;
  date.setUTCDate(date.getUTCDate() - daysSinceMonday);
  const start = date.toISOString().slice(0, 10);
  const displayEnd = addDaysISO(start, 6);
  const end = addDaysISO(displayEnd, 1);
  return { start, end, displayEnd };
}

function getParsedPeriodBounds(parsed) {
  if (parsed.period === 'week') {
    return { ...getWeekBounds(), label: 'Resumo da semana' };
  }

  const bounds = getMonthBounds(parsed.month, parsed.year);
  return { ...bounds, label: `Resumo de ${String(bounds.month).padStart(2, '0')}/${bounds.year}` };
}

async function buildMonthSummary(userId) {
  const bounds = getMonthBounds();
  const { rows } = await query(
    `SELECT COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)::float income_total,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)::float expense_total,
            COUNT(*)::int count
     FROM transactions WHERE user_id = $1 AND date >= $2 AND date < $3`,
    [userId, bounds.start, bounds.end]
  );
  const income = Number(rows[0].income_total);
  const expense = Number(rows[0].expense_total);
  return `Resumo do mês (${formatDateBR(bounds.start)} a ${formatDateBR(bounds.displayEnd)}): receitas ${formatCurrency(income)}, gastos ${formatCurrency(expense)} e saldo ${formatCurrency(income - expense)} em ${rows[0].count} lançamento(s).`;
}

async function buildPeriodSummary(userId, parsed) {
  const bounds = getParsedPeriodBounds(parsed);
  const [{ rows: totals }, { rows: categories }] = await Promise.all([
    query(
      `SELECT COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)::float income_total,
              COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)::float expense_total,
              COUNT(*)::int count
       FROM transactions
       WHERE user_id = $1 AND date >= $2 AND date < $3`,
      [userId, bounds.start, bounds.end]
    ),
    query(
      `SELECT category, COALESCE(SUM(amount), 0)::float total
       FROM transactions
       WHERE user_id = $1 AND type = 'expense' AND date >= $2 AND date < $3
       GROUP BY category
       ORDER BY total DESC
       LIMIT 1`,
      [userId, bounds.start, bounds.end]
    )
  ]);

  const income = Number(totals[0].income_total);
  const expense = Number(totals[0].expense_total);
  const topCategory = categories[0];
  const topText = topCategory ? ` Maior categoria: ${topCategory.category} (${formatCurrency(topCategory.total)}).` : '';

  return `${bounds.label} (${formatDateBR(bounds.start)} a ${formatDateBR(bounds.displayEnd)}): receitas ${formatCurrency(income)}, gastos ${formatCurrency(expense)} e saldo ${formatCurrency(income - expense)} em ${totals[0].count} lancamento(s).${topText}`;
}

async function buildTodaySummary(userId) {
  const { rows } = await query(
    `SELECT COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)::float income_total,
            COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)::float expense_total,
            COUNT(*)::int count
     FROM transactions WHERE user_id = $1 AND date = $2`,
    [userId, todayISO()]
  );
  const income = Number(rows[0].income_total);
  const expense = Number(rows[0].expense_total);
  return `Hoje: receitas ${formatCurrency(income)}, gastos ${formatCurrency(expense)} e saldo ${formatCurrency(income - expense)} em ${rows[0].count} lançamento(s).`;
}

async function buildCategorySummary(userId, category) {
  const bounds = getMonthBounds();
  const { rows } = await query(
    `SELECT COALESCE(SUM(amount), 0)::float total
     FROM transactions WHERE user_id = $1 AND type = 'expense' AND category = $2 AND date >= $3 AND date < $4`,
    [userId, category, bounds.start, bounds.end]
  );
  return `${category} no mês (${formatDateBR(bounds.start)} a ${formatDateBR(bounds.displayEnd)}): ${formatCurrency(rows[0].total)}.`;
}

async function createSavingsGoal(userId, parsed) {
  const required = monthlyRequired(parsed.amount, 0, parsed.months);
  const { rows } = await query(
    `INSERT INTO goals (user_id, title, target_amount, current_amount, deadline, monthly_required_amount, created_via)
     VALUES ($1, $2, $3, 0, $4, $5, 'whatsapp')
     RETURNING title, target_amount::float target_amount, deadline, monthly_required_amount::float monthly_required_amount`,
    [userId, parsed.title, parsed.amount, parsed.deadline, required]
  );
  const goal = rows[0];
  return `Meta criada: juntar ${formatCurrency(goal.target_amount)} ate ${formatDateBR(goal.deadline)}. Voce precisa guardar ${formatCurrency(goal.monthly_required_amount)} por mes para alcancar esse objetivo.`;
}

async function buildGoalsSummary(userId) {
  const { rows } = await query(
    `SELECT title, target_amount::float target_amount, current_amount::float current_amount,
            deadline, monthly_required_amount::float monthly_required_amount,
            GREATEST(target_amount - current_amount, 0)::float remaining_amount
     FROM goals
     WHERE user_id = $1 AND status = 'active'
     ORDER BY deadline ASC, created_at DESC
     LIMIT 3`,
    [userId]
  );

  if (!rows.length) {
    return 'Voce ainda nao tem metas financeiras. Exemplo: "quero juntar 3000 em 6 meses".';
  }

  return `Suas metas:\n${rows
    .map((goal, index) => `${index + 1}. ${goal.title}: faltam ${formatCurrency(goal.remaining_amount)} de ${formatCurrency(goal.target_amount)} ate ${formatDateBR(goal.deadline)}. Guarde ${formatCurrency(goal.monthly_required_amount)} por mes.`)
    .join('\n')}`;
}

async function buildSpendingPlanReply(userId, period = 'month') {
  const plan = await buildSpendingPlan(userId);

  if (plan.incomeTotal <= 0) {
    return 'Ainda nao encontrei receitas neste mes. Registre algo como "recebi 2500 salario" para eu calcular quanto voce pode gastar.';
  }

  if (plan.availableThisMonth < 0) {
    return `Atencao: voce ja passou do limite planejado em ${formatCurrency(Math.abs(plan.availableThisMonth))}. Receitas: ${formatCurrency(plan.incomeTotal)}, gastos: ${formatCurrency(plan.expenseTotal)}, metas do mes: ${formatCurrency(plan.monthlyGoalTotal)}.`;
  }

  const mainLimit = period === 'week'
    ? `Voce pode gastar cerca de ${formatCurrency(plan.weeklyLimit)} por semana`
    : `Voce ainda pode gastar ${formatCurrency(plan.safeAvailableThisMonth)} neste mes`;

  return `${mainLimit}. Disponivel no mes: ${formatCurrency(plan.safeAvailableThisMonth)}. Limite diario sugerido: ${formatCurrency(plan.dailyLimit)}. Estou reservando ${formatCurrency(plan.monthlyGoalTotal)} para ${plan.activeGoalCount} meta(s).`;
}

async function buildRecentTransactions(userId) {
  const { rows } = await query(
    `SELECT id, type, amount::float amount, category, description, date
     FROM transactions
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 5`,
    [userId]
  );

  if (!rows.length) {
    return 'Você ainda não tem lançamentos. Envie algo como "sushi 25" para registrar o primeiro.';
  }

  return `Últimos lançamentos:\n${rows.map((row, index) => formatTransactionLine(row, index + 1)).join('\n')}`;
}

async function deleteLastTransaction(userId) {
  const { rows } = await query(
    `SELECT id, type, amount::float amount, category, description, date
     FROM transactions
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );

  const transaction = rows[0];
  if (!transaction) {
    return 'Não encontrei nenhum lançamento para apagar.';
  }

  await query('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [transaction.id, userId]);
  return `Apaguei o último lançamento: ${formatTransactionLine(transaction)}.`;
}

async function correctLastTransactionCategory(userId, category) {
  const { rows } = await query(
    `SELECT id, type, amount::float amount, category, description, date
     FROM transactions
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );

  const transaction = rows[0];
  if (!transaction) {
    return 'Não encontrei nenhum lançamento para corrigir.';
  }

  const { rows: updatedRows } = await query(
    `UPDATE transactions
     SET category = $1, updated_at = NOW()
     WHERE id = $2 AND user_id = $3
     RETURNING id, amount::float amount, category, description, date`,
    [category, transaction.id, userId]
  );

  return `Corrigi o último lançamento de ${transaction.category} para ${category}: ${formatTransactionLine(updatedRows[0])}.`;
}

async function buildTextReport(userId) {
  const bounds = getMonthBounds();
  const today = todayISO();
  const elapsedDays = Math.max(
    1,
    Math.min(bounds.daysInMonth, new Date(today).getUTCDate())
  );

  const [{ rows: totals }, { rows: categories }, { rows: budgets }] = await Promise.all([
    query(
      `SELECT COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)::float income_total,
              COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)::float expense_total,
              COUNT(*)::int count
       FROM transactions
       WHERE user_id = $1 AND date >= $2 AND date < $3`,
      [userId, bounds.start, bounds.end]
    ),
    query(
      `SELECT category, COALESCE(SUM(amount), 0)::float total, COUNT(*)::int count
       FROM transactions
       WHERE user_id = $1 AND type = 'expense' AND date >= $2 AND date < $3
       GROUP BY category
       ORDER BY total DESC`,
      [userId, bounds.start, bounds.end]
    ),
    query(
      `SELECT b.category,
              b.limit_amount::float limit_amount,
              COALESCE(SUM(t.amount), 0)::float spent
       FROM budgets b
       LEFT JOIN transactions t
        ON t.user_id = b.user_id
       AND t.category = b.category
       AND t.type = 'expense'
       AND t.date >= $4
        AND t.date < $5
       WHERE b.user_id = $1 AND b.month = $2 AND b.year = $3
       GROUP BY b.category, b.limit_amount
       ORDER BY spent DESC`,
      [userId, bounds.month, bounds.year, bounds.start, bounds.end]
    )
  ]);

  const income = Number(totals[0].income_total);
  const total = Number(totals[0].expense_total);
  const count = Number(totals[0].count);

  if (!count) {
    return `Análise mensal (${formatDateBR(bounds.start)} a ${formatDateBR(bounds.displayEnd)}): ainda não há lançamentos. Envie algo como "sushi 25" para começar.`;
  }

  const averagePerDay = total / elapsedDays;
  const projectedTotal = averagePerDay * bounds.daysInMonth;
  const topCategory = categories[0];
  const categoryText = categories
    .slice(0, 4)
    .map((row) => `${row.category}: ${formatCurrency(row.total)} (${row.count}x)`)
    .join('; ');

  const budgetAlerts = budgets
    .filter((row) => Number(row.limit_amount) > 0)
    .slice(0, 3)
    .map((row) => {
      const spent = Number(row.spent);
      const limit = Number(row.limit_amount);
      const percent = Math.round((spent / limit) * 100);
      return `${row.category}: ${percent}% da meta (${formatCurrency(spent)} de ${formatCurrency(limit)})`;
    });

  const budgetText = budgetAlerts.length
    ? ` Metas: ${budgetAlerts.join('; ')}.`
    : ' Nenhuma meta definida neste mês. Exemplo: meta 1000 alimentação.';

  const topCategoryText = topCategory
    ? ` Maior categoria: ${topCategory.category} (${formatCurrency(topCategory.total)}). Categorias: ${categoryText}.`
    : ' Ainda não há gastos categorizados neste mês.';

  return `Análise mensal (${formatDateBR(bounds.start)} a ${formatDateBR(bounds.displayEnd)}): receitas ${formatCurrency(income)}, gastos ${formatCurrency(total)} e saldo ${formatCurrency(income - total)} em ${count} lançamento(s). Média diária de gastos: ${formatCurrency(averagePerDay)}. Projeção de gastos até o fim do mês: ${formatCurrency(projectedTotal)}.${topCategoryText}${budgetText}`;
}

export function verifyWhatsAppWebhook(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token && token === env.metaVerifyToken) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
}

export async function handleWhatsAppWebhook(req, res) {
  const provider = getInboundWhatsAppProvider(req);
  const inbound = provider.extractInboundMessage(req);
  const { from, body } = inbound;

  if (!from && !body) {
    const deliveryStatuses = logDeliveryStatuses(provider, req);
    return sendWebhookReply(provider, res, {
      ok: true,
      status: deliveryStatuses.length ? 'delivery_status' : 'ignored'
    });
  }

  const user =
    (from ? await findUserByWhatsapp(from) : null) ||
    (inbound.shouldAutoCreateUser && from ? await createWhatsappUser(from, inbound.profileName) : null);
  const parsed = parseWhatsAppMessage(body);

  if (!user) {
    await query(
      'INSERT INTO whatsapp_logs (raw_message, parsed_data, status) VALUES ($1, $2, $3)',
      [body || '', parsed, 'unknown_user']
    );
    const reply = 'Não encontrei um perfil vinculado a este WhatsApp. Cadastre seu número na dashboard.';
    await sendOutboundReply(inbound, from, reply);
    return sendWebhookReply(provider, res, { ok: true, status: 'unknown_user', reply });
  }

  let reply = '';
  let status = 'processed';

  if (!parsed.ok) {
    status = 'parse_error';
    reply = parsed.message;
  } else if (parsed.type === 'help') {
    reply = buildHelpMessage();
  } else if (parsed.type === 'last-transactions') {
    reply = await buildRecentTransactions(user.id);
  } else if (parsed.type === 'delete-last-transaction') {
    reply = await deleteLastTransaction(user.id);
  } else if (parsed.type === 'correct-last-category') {
    reply = await correctLastTransactionCategory(user.id, parsed.category);
  } else if (parsed.type === 'transaction') {
    await query(
      `INSERT INTO transactions (user_id, type, amount, category, description, date, created_via)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [user.id, parsed.transactionType, parsed.amount, parsed.category, parsed.description, parsed.date, parsed.createdVia]
    );
    reply = parsed.transactionType === 'income'
      ? `Receita registrada: ${formatCurrency(parsed.amount)} em ${parsed.category} (${parsed.description}).`
      : `Gasto registrado: ${formatCurrency(parsed.amount)} em ${parsed.category} (${parsed.description}).`;
  } else if (parsed.type === 'resumo') {
    reply = await buildMonthSummary(user.id);
  } else if (parsed.type === 'period-summary') {
    reply = await buildPeriodSummary(user.id, parsed);
  } else if (parsed.type === 'hoje') {
    reply = await buildTodaySummary(user.id);
  } else if (parsed.type === 'period') {
    reply = buildPeriodInfo();
  } else if (parsed.type === 'category-summary') {
    reply = await buildCategorySummary(user.id, parsed.category);
  } else if (parsed.type === 'goal') {
    reply = await createSavingsGoal(user.id, parsed);
  } else if (parsed.type === 'goals-summary') {
    reply = await buildGoalsSummary(user.id);
  } else if (parsed.type === 'spending-plan') {
    reply = await buildSpendingPlanReply(user.id, parsed.period);
  } else if (parsed.type === 'budget') {
    const now = new Date();
    await query(
      `INSERT INTO budgets (user_id, category, limit_amount, month, year)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, category, month, year)
       DO UPDATE SET limit_amount = EXCLUDED.limit_amount, updated_at = NOW()`,
      [user.id, parsed.category, parsed.amount, now.getMonth() + 1, now.getFullYear()]
    );
    reply = `Meta definida: ${formatCurrency(parsed.amount)} para ${parsed.category}.`;
  } else if (parsed.type === 'report') {
    reply = await buildTextReport(user.id);
  }

  await query(
    'INSERT INTO whatsapp_logs (user_id, raw_message, parsed_data, status) VALUES ($1, $2, $3, $4)',
    [user.id, body || '', parsed, status]
  );
  await sendOutboundReply(inbound, from, reply);

  return sendWebhookReply(provider, res, { ok: true, status, reply });
}
