import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/pool.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';
import { normalizeWhatsappNumber } from '../utils/whatsappNumber.js';

export function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email, name: user.name }, env.jwtSecret, { expiresIn: '7d' });
}

export async function register(req, res) {
  const { name, email, password, whatsappNumber } = req.body;
  const passwordHash = await bcrypt.hash(password, 10);
  const normalizedWhatsappNumber = normalizeWhatsappNumber(whatsappNumber);

  try {
    const { rows } = await query(
      `INSERT INTO users (name, email, password_hash, whatsapp_number)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, whatsapp_number, created_at`,
      [name, email.toLowerCase(), passwordHash, normalizedWhatsappNumber]
    );

    res.status(201).json({ user: rows[0], token: signToken(rows[0]) });
  } catch (error) {
    if (error.code === '23505') {
      throw new ApiError(409, 'E-mail ou WhatsApp ja cadastrado.');
    }
    throw error;
  }
}

export async function login(req, res) {
  const { email, password } = req.body;
  const { rows } = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  const user = rows[0];

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new ApiError(401, 'Credenciais invalidas.');
  }

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      whatsapp_number: user.whatsapp_number
    },
    token: signToken(user)
  });
}
