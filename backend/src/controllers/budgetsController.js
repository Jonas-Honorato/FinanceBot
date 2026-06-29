import { query } from '../db/pool.js';
import { getMonthBounds } from '../utils/date.js';

export async function listBudgets(req, res) {
  const bounds = getMonthBounds(Number(req.query.month) || undefined, Number(req.query.year) || undefined);
  const { rows } = await query(
    `SELECT b.id, b.category, b.limit_amount::float, b.month, b.year,
            COALESCE(SUM(t.amount), 0)::float spent
     FROM budgets b
     LEFT JOIN transactions t ON t.user_id = b.user_id
      AND t.category = b.category AND t.date >= $3 AND t.date < $4
     WHERE b.user_id = $1 AND b.month = $2 AND b.year = $5
     GROUP BY b.id
     ORDER BY b.category`,
    [req.user.id, bounds.month, bounds.start, bounds.end, bounds.year]
  );
  res.json({ data: rows });
}

export async function upsertBudget(req, res) {
  const { category, limitAmount, month, year } = req.body;
  const current = getMonthBounds(month, year);
  const { rows } = await query(
    `INSERT INTO budgets (user_id, category, limit_amount, month, year)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, category, month, year)
     DO UPDATE SET limit_amount = EXCLUDED.limit_amount, updated_at = NOW()
     RETURNING *`,
    [req.user.id, category, limitAmount, current.month, current.year]
  );
  res.status(201).json({ data: rows[0] });
}
