import { Router } from 'express';
import Joi from 'joi';
import { createGoal, deleteGoal, listGoals, updateGoal } from '../controllers/goalsController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { validate } from '../middlewares/validate.js';

export const goalsRoutes = Router();

const goalSchema = Joi.object({
  title: Joi.string().max(160).required(),
  targetAmount: Joi.number().positive().precision(2).required(),
  currentAmount: Joi.number().min(0).precision(2).default(0),
  deadline: Joi.date().iso().required(),
  status: Joi.string().valid('active', 'completed', 'archived').default('active'),
  createdVia: Joi.string().valid('manual', 'whatsapp').default('manual')
});

goalsRoutes.get('/', asyncHandler(listGoals));
goalsRoutes.post('/', validate(goalSchema), asyncHandler(createGoal));
goalsRoutes.put('/:id', validate(goalSchema), asyncHandler(updateGoal));
goalsRoutes.delete('/:id', asyncHandler(deleteGoal));
