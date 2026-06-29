import { Router } from 'express';
import Joi from 'joi';
import { CATEGORIES } from '../config/categories.js';
import { listBudgets, upsertBudget } from '../controllers/budgetsController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { validate } from '../middlewares/validate.js';

export const budgetsRoutes = Router();

budgetsRoutes.get('/', asyncHandler(listBudgets));
budgetsRoutes.post('/', validate(Joi.object({
  category: Joi.string().valid(...CATEGORIES).required(),
  limitAmount: Joi.number().positive().precision(2).required(),
  month: Joi.number().integer().min(1).max(12),
  year: Joi.number().integer().min(2000)
})), asyncHandler(upsertBudget));
