import { Router } from 'express';
import Joi from 'joi';
import { CATEGORIES } from '../config/categories.js';
import { createTransaction, deleteTransaction, listTransactions, updateTransaction } from '../controllers/transactionsController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { validate } from '../middlewares/validate.js';

export const transactionsRoutes = Router();

const transactionSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required(),
  category: Joi.string().valid(...CATEGORIES).required(),
  description: Joi.string().max(280).allow('', null),
  date: Joi.date().iso().required(),
  createdVia: Joi.string().valid('manual', 'whatsapp').default('manual')
});

transactionsRoutes.get('/', asyncHandler(listTransactions));
transactionsRoutes.post('/', validate(transactionSchema), asyncHandler(createTransaction));
transactionsRoutes.put('/:id', validate(transactionSchema), asyncHandler(updateTransaction));
transactionsRoutes.delete('/:id', asyncHandler(deleteTransaction));
