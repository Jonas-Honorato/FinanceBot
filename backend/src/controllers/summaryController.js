import { query } from '../db/pool.js';
import { getMonthBounds, todayISO } from '../utils/date.js';

export async function monthlySummary(req, res) {
  const bounds = getMonthBounds(Number(req.query.month) || undefined, Number(req.query.year) || undefined);
  const previous = bounds.month === 1 ? getMonthBounds(12, bounds.year - 1) : getMonthBounds(bounds.month - 1, bounds.year);

  const [{ rows: totals }, { rows: previousTotals }, { rows: top }, { rows: biggest }] = await Promise.all([
    query(
      `SELECT COALESCE(SUM(amount), 0) total, COUNT(*) count
       FROM transactions WHERE user_id = $1 AND date >= $2 AND date < $3`,
      [req.user.id, bounds.start, bounds.end]
    ),
    query(
      `SELECT COALESCE(SUM(amount), 0) total
       FROM transactions WHERE user_id = $1 AND date >= $2 AND date < $3`,
      [req.user.id, previous.start, previous.end]
    ),
    query(
      `SELECT category, SUM(amount) total
       FROM transactions WHERE user_id = $1 AND date >= $2 AND date < $3
       GROUP BY category ORDER BY total DESC LIMIT 1`,
      [req.user.id, bounds.start, bounds.end]
    ),
    query(
      `SELECT amount, category, description, date
       FROM transactions WHERE user_id = $1 AND date >= $2 AND date < $3
       ORDER BY amount DESC LIMIT 1`,
      [req.user.id, bounds.start, bounds.end]
    )
  ]);

  res.json({
    total: Number(totals[0].total),
    count: Number(totals[0].count),
    previousTotal: Number(previousTotals[0].total),
    topCategory: top[0] || null,
    biggestTransaction: biggest[0] || null,
    month: bounds.month,
    year: bounds.year
  });
}

export async function byCategory(req, res) {
  const bounds = getMonthBounds(Number(req.query.month) || undefined, Number(req.query.year) || undefined);
  const { rows } = await query(
    `SELECT category, SUM(amount)::float total
     FROM transactions
     WHERE user_id = $1 AND date >= $2 AND date < $3
     GROUP BY category ORDER BY total DESC`,
    [req.user.id, bounds.start, bounds.end]
  );
  res.json({ data: rows });
}

export async function dailySummary(req, res) {
  const bounds = getMonthBounds(Number(req.query.month) || undefined, Number(req.query.year) || undefined);
  const { rows } = await query(
    `SELECT date, EXTRACT(DOW FROM date)::int weekday, SUM(amount)::float total
     FROM transactions
     WHERE user_id = $1 AND date >= $2 AND date < $3
     GROUP BY date ORDER BY date`,
    [req.user.id, bounds.start, bounds.end]
  );
  res.json({ data: rows });
}

export async function todaySummary(req, res) {
  const { rows } = await query(
    `SELECT COALESCE(SUM(amount), 0)::float total, COUNT(*)::int count
     FROM transactions WHERE user_id = $1 AND date = $2`,
    [req.user.id, todayISO()]
  );
  res.json(rows[0]);
}

export async function comparisonByCategory(req, res) {
  const bounds = getMonthBounds(Number(req.query.month) || undefined, Number(req.query.year) || undefined);
  const previous = bounds.month === 1 ? getMonthBounds(12, bounds.year - 1) : getMonthBounds(bounds.month - 1, bounds.year);
  const { rows } = await query(
    `WITH current_month AS (
       SELECT category, SUM(amount)::float total
       FROM transactions WHERE user_id = $1 AND date >= $2 AND date < $3 GROUP BY category
     ), previous_month AS (
       SELECT category, SUM(amount)::float total
       FROM transactions WHERE user_id = $1 AND date >= $4 AND date < $5 GROUP BY category
     )
     SELECT COALESCE(c.category, p.category) category,
            COALESCE(c.total, 0) current,
            COALESCE(p.total, 0) previous
     FROM current_month c
     FULL OUTER JOIN previous_month p ON p.category = c.category
     ORDER BY current DESC`,
    [req.user.id, bounds.start, bounds.end, previous.start, previous.end]
  );
  res.json({ data: rows });
}
