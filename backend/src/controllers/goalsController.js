import { query } from '../db/pool.js';
import { ApiError } from '../utils/apiError.js';

function monthsUntil(deadline, from = new Date()) {
  const target = new Date(`${toISODate(deadline)}T00:00:00.000Z`);
  const yearDiff = target.getUTCFullYear() - from.getUTCFullYear();
  const monthDiff = target.getUTCMonth() - from.getUTCMonth();
  const total = yearDiff * 12 + monthDiff + (target.getUTCDate() >= from.getUTCDate() ? 1 : 0);
  return Math.max(1, total);
}

function toISODate(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function monthlyRequired(targetAmount, currentAmount, deadline) {
  const remaining = Math.max(0, Number(targetAmount) - Number(currentAmount || 0));
  return Number((remaining / monthsUntil(deadline)).toFixed(2));
}

function goalSelect() {
  return `id, title, target_amount::float target_amount, current_amount::float current_amount,
          deadline, monthly_required_amount::float monthly_required_amount, status,
          created_via, created_at, updated_at,
          GREATEST(target_amount - current_amount, 0)::float remaining_amount,
          LEAST(ROUND((current_amount / target_amount) * 100), 100)::int progress_percent`;
}

export async function listGoals(req, res) {
  const status = req.query.status || 'active';
  const { rows } = await query(
    `SELECT ${goalSelect()}
     FROM goals
     WHERE user_id = $1 AND ($2 = 'all' OR status = $2)
     ORDER BY status, deadline ASC, created_at DESC`,
    [req.user.id, status]
  );
  res.json({ data: rows });
}

export async function createGoal(req, res) {
  const { title, targetAmount, currentAmount = 0, deadline, createdVia = 'manual' } = req.body;
  const deadlineISO = toISODate(deadline);
  const required = monthlyRequired(targetAmount, currentAmount, deadlineISO);
  const status = Number(currentAmount) >= Number(targetAmount) ? 'completed' : 'active';

  const { rows } = await query(
    `INSERT INTO goals (user_id, title, target_amount, current_amount, deadline, monthly_required_amount, status, created_via)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING ${goalSelect()}`,
    [req.user.id, title, targetAmount, currentAmount, deadlineISO, required, status, createdVia]
  );
  res.status(201).json({ data: rows[0] });
}

export async function updateGoal(req, res) {
  const { title, targetAmount, currentAmount = 0, deadline, status = 'active' } = req.body;
  const deadlineISO = toISODate(deadline);
  const required = monthlyRequired(targetAmount, currentAmount, deadlineISO);
  const finalStatus = status === 'active' && Number(currentAmount) >= Number(targetAmount) ? 'completed' : status;

  const { rows } = await query(
    `UPDATE goals
     SET title = $1, target_amount = $2, current_amount = $3, deadline = $4,
         monthly_required_amount = $5, status = $6, updated_at = NOW()
     WHERE id = $7 AND user_id = $8
     RETURNING ${goalSelect()}`,
    [title, targetAmount, currentAmount, deadlineISO, required, finalStatus, req.params.id, req.user.id]
  );

  if (!rows[0]) throw new ApiError(404, 'Meta nao encontrada.');
  res.json({ data: rows[0] });
}

export async function deleteGoal(req, res) {
  const { rowCount } = await query('DELETE FROM goals WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  if (!rowCount) throw new ApiError(404, 'Meta nao encontrada.');
  res.status(204).send();
}
