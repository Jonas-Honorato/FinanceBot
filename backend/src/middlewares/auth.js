import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';

export function requireAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.query.token || null;

  if (!token) {
    throw new ApiError(401, 'Token de autenticação não informado.');
  }

  try {
    req.user = jwt.verify(token, env.jwtSecret);
    next();
  } catch {
    throw new ApiError(401, 'Token inválido ou expirado.');
  }
}
