import bcrypt from 'bcryptjs';
import { query } from '../db/pool.js';
import { ApiError } from '../utils/apiError.js';
import { normalizeWhatsappNumber } from '../utils/whatsappNumber.js';
import { signToken } from './authController.js';

function toAccount(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    whatsapp_number: user.whatsapp_number,
    created_at: user.created_at
  };
}

export async function getAccount(req, res) {
  const { rows } = await query(
    'SELECT id, name, email, whatsapp_number, created_at FROM users WHERE id = $1',
    [req.user.id]
  );

  if (!rows[0]) throw new ApiError(404, 'Conta nao encontrada.');
  res.json({ data: toAccount(rows[0]) });
}

export async function updateAccount(req, res) {
  const { name, email, whatsappNumber } = req.body;
  const normalizedWhatsappNumber = normalizeWhatsappNumber(whatsappNumber);

  try {
    const { rows } = await query(
      `UPDATE users
       SET name = $1, email = $2, whatsapp_number = $3
       WHERE id = $4
       RETURNING id, name, email, whatsapp_number, created_at`,
      [name, email.toLowerCase(), normalizedWhatsappNumber, req.user.id]
    );

    if (!rows[0]) throw new ApiError(404, 'Conta nao encontrada.');
    res.json({ data: toAccount(rows[0]), token: signToken(rows[0]) });
  } catch (error) {
    if (error.code === '23505') {
      throw new ApiError(409, 'E-mail ou WhatsApp ja cadastrado.');
    }
    throw error;
  }
}

export async function deleteAccount(req, res) {
  const { currentPassword } = req.body;
  const { rows } = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
  const user = rows[0];

  if (!user) throw new ApiError(404, 'Conta nao encontrada.');
  if (!(await bcrypt.compare(currentPassword, user.password_hash))) {
    throw new ApiError(401, 'Senha atual invalida.');
  }

  await query('DELETE FROM whatsapp_logs WHERE user_id = $1', [req.user.id]);
  await query('DELETE FROM users WHERE id = $1', [req.user.id]);
  res.status(204).send();
}
