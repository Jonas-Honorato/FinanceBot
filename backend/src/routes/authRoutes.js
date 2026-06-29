import { Router } from 'express';
import Joi from 'joi';
import { login, register } from '../controllers/authController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { validate } from '../middlewares/validate.js';

export const authRoutes = Router();

authRoutes.post('/register', validate(Joi.object({
  name: Joi.string().min(2).max(120).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  whatsappNumber: Joi.string().max(40).allow('', null)
})), asyncHandler(register));

authRoutes.post('/login', validate(Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
})), asyncHandler(login));
