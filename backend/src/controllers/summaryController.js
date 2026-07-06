import { query } from '../db/pool.js';
import { buildSpendingPlan } from '../services/spendingPlanService.js';
import { getMonthBounds, todayISO } from '../utils/date.js';

export async function monthlySummary(req, res) {
  const bounds = getMonthBounds(Number(req.query.month) || undefined, Number(req.query.year) || undefined);
  const previous = bounds.month === 1 ? getMonthBounds(12, bounds.year - 1) : getMonthBounds(bounds.month - 1, bounds.year);

  const [{ rows: totals }, { rows: previousTotals }, { rows: top }, { rows: biggest }] = await Promise.all([
    query(
      `SELECT COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) expense_total,
              COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) income_total,
              COUNT(*) count,
              COALESCE(SUM(CASE WHEN type = 'expense' THEN 1 ELSE 0 END), 0) expense_count,
              COALESCE(SUM(CASE WHEN type = 'income' THEN 1 ELSE 0 END), 0) income_count
       FROM transactions WHERE user_id = $1 AND date >= $2 AND date < $3`,
      [req.user.id, bounds.start, bounds.end]
    ),
    query(
      `SELECT COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) expense_total,
              COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) income_total
       FROM transactions WHERE user_id = $1 AND date >= $2 AND date < $3`,
      [req.user.id, previous.start, previous.end]
    ),
    query(
      `SELECT category, SUM(amount) total
       FROM transactions WHERE user_id = $1 AND type = 'expense' AND date >= $2 AND date < $3
       GROUP BY category ORDER BY total DESC LIMIT 1`,
      [req.user.id, bounds.start, bounds.end]
    ),
    query(
      `SELECT type, amount, category, description, date
       FROM transactions WHERE user_id = $1 AND type = 'expense' AND date >= $2 AND date < $3
       ORDER BY amount DESC LIMIT 1`,
      [req.user.id, bounds.start, bounds.end]
    )
  ]);

  const expenseTotal = Number(totals[0].expense_total);
  const incomeTotal = Number(totals[0].income_total);
  const previousExpenseTotal = Number(previousTotals[0].expense_total);
  const previousIncomeTotal = Number(previousTotals[0].income_total);

  res.json({
    total: expenseTotal,
    expenseTotal,
    incomeTotal,
    balance: incomeTotal - expenseTotal,
    count: Number(totals[0].count),
    expenseCount: Number(totals[0].expense_count),
    incomeCount: Number(totals[0].income_count),
    previousTotal: previousExpenseTotal,
    previousExpenseTotal,
    previousIncomeTotal,
    previousBalance: previousIncomeTotal - previousExpenseTotal,
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
     WHERE user_id = $1 AND type = 'expense' AND date >= $2 AND date < $3
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
     WHERE user_id = $1 AND type = 'expense' AND date >= $2 AND date < $3
     GROUP BY date ORDER BY date`,
    [req.user.id, bounds.start, bounds.end]
  );
  res.json({ data: rows });
}

export async function todaySummary(req, res) {
  const { rows } = await query(
    `SELECT COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)::float expense_total,
            COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)::float income_total,
            COUNT(*)::int count
     FROM transactions WHERE user_id = $1 AND date = $2`,
    [req.user.id, todayISO()]
  );
  const row = rows[0];
  res.json({
    ...row,
    total: Number(row.expense_total),
    balance: Number(row.income_total) - Number(row.expense_total)
  });
}

export async function comparisonByCategory(req, res) {
  const bounds = getMonthBounds(Number(req.query.month) || undefined, Number(req.query.year) || undefined);
  const previous = bounds.month === 1 ? getMonthBounds(12, bounds.year - 1) : getMonthBounds(bounds.month - 1, bounds.year);
  const { rows } = await query(
    `WITH current_month AS (
       SELECT category, SUM(amount)::float total
       FROM transactions WHERE user_id = $1 AND type = 'expense' AND date >= $2 AND date < $3 GROUP BY category
     ), previous_month AS (
       SELECT category, SUM(amount)::float total
       FROM transactions WHERE user_id = $1 AND type = 'expense' AND date >= $4 AND date < $5 GROUP BY category
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

export async function spendingPlan(req, res) {
  const plan = await buildSpendingPlan(
    req.user.id,
    Number(req.query.month) || undefined,
    Number(req.query.year) || undefined
  );
  res.json(plan);
}
