import { query } from '../db/pool.js';
import { ApiError } from '../utils/apiError.js';

export async function listTransactions(req, res) {
  const filters = [];
  const values = [req.user.id];

  const addFilter = (sql, value) => {
    values.push(value);
    filters.push(sql.replace('?', `$${values.length}`));
  };

  if (req.query.category) addFilter('category = ?', req.query.category);
  if (req.query.type) addFilter('type = ?', req.query.type);
  if (req.query.startDate) addFilter('date >= ?', req.query.startDate);
  if (req.query.endDate) addFilter('date <= ?', req.query.endDate);
  if (req.query.minAmount) addFilter('amount >= ?', req.query.minAmount);
  if (req.query.maxAmount) addFilter('amount <= ?', req.query.maxAmount);
  if (req.query.search) addFilter('description ILIKE ?', `%${req.query.search}%`);

  const page = Number(req.query.page || 1);
  const pageSize = Math.min(Number(req.query.pageSize || 20), 100);
  const offset = (page - 1) * pageSize;
  values.push(pageSize, offset);

  const where = filters.length ? `AND ${filters.join(' AND ')}` : '';
  const { rows } = await query(
    `SELECT id, type, amount, category, description, date, created_via, created_at, updated_at
     FROM transactions
     WHERE user_id = $1 ${where}
     ORDER BY date DESC, created_at DESC
     LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values
  );

  res.json({ data: rows, page, pageSize });
}

export async function createTransaction(req, res) {
  const { type = 'expense', amount, category, description, date, createdVia = 'manual' } = req.body;
  const { rows } = await query(
    `INSERT INTO transactions (user_id, type, amount, category, description, date, created_via)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [req.user.id, type, amount, category, description || null, date, createdVia]
  );
  res.status(201).json({ data: rows[0] });
}

export async function updateTransaction(req, res) {
  const { type = 'expense', amount, category, description, date } = req.body;
  const { rows } = await query(
    `UPDATE transactions
     SET type = $1, amount = $2, category = $3, description = $4, date = $5, updated_at = NOW()
     WHERE id = $6 AND user_id = $7
     RETURNING *`,
    [type, amount, category, description || null, date, req.params.id, req.user.id]
  );

  if (!rows[0]) throw new ApiError(404, 'Transação não encontrada.');
  res.json({ data: rows[0] });
}

export async function deleteTransaction(req, res) {
  const { rowCount } = await query('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  if (!rowCount) throw new ApiError(404, 'Transação não encontrada.');
  res.status(204).send();
}
