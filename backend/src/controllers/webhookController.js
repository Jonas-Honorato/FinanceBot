import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { query } from '../db/pool.js';
import { parseWhatsAppMessage } from '../services/whatsappParser.js';
import { formatCurrency, sendWhatsAppMessage } from '../services/whatsappSender.js';
import { formatDateBR, getMonthBounds, todayISO } from '../utils/date.js';

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function isTwilioWebhook(req) {
  return Boolean(req.body.MessageSid || req.body.SmsMessageSid || req.body.WaId || req.body.ProfileName);
}

function sendWebhookReply(req, res, payload) {
  if (isTwilioWebhook(req)) {
    return res
      .type('text/xml')
      .send(`<Response><Message>${escapeXml(payload.reply || '')}</Message></Response>`);
  }

  return res.json(payload);
}

async function findUserByWhatsapp(number) {
  const { rows } = await query('SELECT id, name, whatsapp_number FROM users WHERE whatsapp_number = $1', [number]);
  return rows[0];
}

async function createWhatsappUser(number, name = 'WhatsApp User') {
  const normalized = String(number).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  const email = `${normalized}@whatsapp.financebot.local`;
  const passwordHash = await bcrypt.hash(crypto.randomUUID(), 10);

  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash, whatsapp_number)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (whatsapp_number)
     DO UPDATE SET whatsapp_number = EXCLUDED.whatsapp_number
     RETURNING id, name, email, whatsapp_number`,
    [name || 'WhatsApp User', email, passwordHash, number]
  );

  return rows[0];
}

function buildHelpMessage() {
  return [
    'Comandos do FinanceBot:',
    'Registrar gasto: "sushi 25" ou "gastei R$45 no mercado".',
    'Resumo do mês: resumo.',
    'Análise mensal: relatorio.',
    'Gastos de hoje: hoje.',
    'Período da contagem: periodo.',
    'Categoria específica: categoria alimentacao.',
    'Definir meta: meta 1000 alimentacao.',
    'Ver comandos: ajuda.'
  ].join('\n');
}

function buildPeriodInfo() {
  const bounds = getMonthBounds();
  return `Estou contando os gastos deste mês de ${formatDateBR(bounds.start)} até ${formatDateBR(bounds.displayEnd)}. O mês atual é ${String(bounds.month).padStart(2, '0')}/${bounds.year}.`;
}

async function buildMonthSummary(userId) {
  const bounds = getMonthBounds();
  const { rows } = await query(
    `SELECT COALESCE(SUM(amount), 0)::float total, COUNT(*)::int count
     FROM transactions WHERE user_id = $1 AND date >= $2 AND date < $3`,
    [userId, bounds.start, bounds.end]
  );
  return `Resumo do mês (${formatDateBR(bounds.start)} a ${formatDateBR(bounds.displayEnd)}): ${formatCurrency(rows[0].total)} em ${rows[0].count} lançamento(s).`;
}

async function buildTodaySummary(userId) {
  const { rows } = await query(
    `SELECT COALESCE(SUM(amount), 0)::float total, COUNT(*)::int count
     FROM transactions WHERE user_id = $1 AND date = $2`,
    [userId, todayISO()]
  );
  return `Hoje você gastou ${formatCurrency(rows[0].total)} em ${rows[0].count} lançamento(s).`;
}

async function buildCategorySummary(userId, category) {
  const bounds = getMonthBounds();
  const { rows } = await query(
    `SELECT COALESCE(SUM(amount), 0)::float total
     FROM transactions WHERE user_id = $1 AND category = $2 AND date >= $3 AND date < $4`,
    [userId, category, bounds.start, bounds.end]
  );
  return `${category} no mês (${formatDateBR(bounds.start)} a ${formatDateBR(bounds.displayEnd)}): ${formatCurrency(rows[0].total)}.`;
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
      `SELECT COALESCE(SUM(amount), 0)::float total, COUNT(*)::int count
       FROM transactions
       WHERE user_id = $1 AND date >= $2 AND date < $3`,
      [userId, bounds.start, bounds.end]
    ),
    query(
      `SELECT category, COALESCE(SUM(amount), 0)::float total, COUNT(*)::int count
       FROM transactions
       WHERE user_id = $1 AND date >= $2 AND date < $3
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
        AND t.date >= $4
        AND t.date < $5
       WHERE b.user_id = $1 AND b.month = $2 AND b.year = $3
       GROUP BY b.category, b.limit_amount
       ORDER BY spent DESC`,
      [userId, bounds.month, bounds.year, bounds.start, bounds.end]
    )
  ]);

  const total = Number(totals[0].total);
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

  return `Análise mensal (${formatDateBR(bounds.start)} a ${formatDateBR(bounds.displayEnd)}): ${formatCurrency(total)} em ${count} lançamento(s). Média diária: ${formatCurrency(averagePerDay)}. Projeção até o fim do mês: ${formatCurrency(projectedTotal)}. Maior categoria: ${topCategory.category} (${formatCurrency(topCategory.total)}). Categorias: ${categoryText}.${budgetText}`;
}

export async function handleWhatsAppWebhook(req, res) {
  const from = req.body.From || req.body.from || req.body.whatsappNumber;
  const body = req.body.Body || req.body.body || req.body.message;
  const user = (await findUserByWhatsapp(from)) || (isTwilioWebhook(req) && from ? await createWhatsappUser(from, req.body.ProfileName) : null);
  const parsed = parseWhatsAppMessage(body);

  if (!user) {
    await query(
      'INSERT INTO whatsapp_logs (raw_message, parsed_data, status) VALUES ($1, $2, $3)',
      [body || '', parsed, 'unknown_user']
    );
    const reply = 'Não encontrei um perfil vinculado a este WhatsApp. Cadastre seu número na dashboard.';
    if (!isTwilioWebhook(req)) {
      await sendWhatsAppMessage(from, reply);
    }
    return sendWebhookReply(req, res, { ok: true, status: 'unknown_user', reply });
  }

  let reply = '';
  let status = 'processed';

  if (!parsed.ok) {
    status = 'parse_error';
    reply = parsed.message;
  } else if (parsed.type === 'help') {
    reply = buildHelpMessage();
  } else if (parsed.type === 'transaction') {
    await query(
      `INSERT INTO transactions (user_id, amount, category, description, date, created_via)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [user.id, parsed.amount, parsed.category, parsed.description, parsed.date, parsed.createdVia]
    );
    reply = `Registrado: ${formatCurrency(parsed.amount)} em ${parsed.category} (${parsed.description}).`;
  } else if (parsed.type === 'resumo') {
    reply = await buildMonthSummary(user.id);
  } else if (parsed.type === 'hoje') {
    reply = await buildTodaySummary(user.id);
  } else if (parsed.type === 'period') {
    reply = buildPeriodInfo();
  } else if (parsed.type === 'category-summary') {
    reply = await buildCategorySummary(user.id, parsed.category);
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
  if (!isTwilioWebhook(req)) {
    await sendWhatsAppMessage(from, reply);
  }

  return sendWebhookReply(req, res, { ok: true, status, reply });
}
