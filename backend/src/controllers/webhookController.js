import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { query } from '../db/pool.js';
import { parseWhatsAppMessage } from '../services/whatsappParser.js';
import { formatCurrency, sendWhatsAppMessage } from '../services/whatsappSender.js';
import { getMonthBounds, todayISO } from '../utils/date.js';

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

async function buildMonthSummary(userId) {
  const bounds = getMonthBounds();
  const { rows } = await query(
    `SELECT COALESCE(SUM(amount), 0)::float total, COUNT(*)::int count
     FROM transactions WHERE user_id = $1 AND date >= $2 AND date < $3`,
    [userId, bounds.start, bounds.end]
  );
  return `Resumo do mês: ${formatCurrency(rows[0].total)} em ${rows[0].count} lançamento(s).`;
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
  return `${category} no mês: ${formatCurrency(rows[0].total)}.`;
}

async function buildTextReport(userId) {
  const bounds = getMonthBounds();
  const { rows } = await query(
    `SELECT category, COALESCE(SUM(amount), 0)::float total, COUNT(*)::int count
     FROM transactions
     WHERE user_id = $1 AND date >= $2 AND date < $3
     GROUP BY category
     ORDER BY total DESC`,
    [userId, bounds.start, bounds.end]
  );

  if (!rows.length) {
    return 'Relatório do mês: ainda não há lançamentos.';
  }

  const total = rows.reduce((sum, row) => sum + Number(row.total), 0);
  const categories = rows
    .slice(0, 5)
    .map((row) => `${row.category}: ${formatCurrency(row.total)} em ${row.count} lançamento(s)`)
    .join('; ');

  return `Relatório do mês: ${formatCurrency(total)} no total. ${categories}.`;
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
