import { Router } from 'express';
import Joi from 'joi';
import { deleteAccount, getAccount, updateAccount } from '../controllers/accountController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { validate } from '../middlewares/validate.js';

export const accountRoutes = Router();

const accountSchema = Joi.object({
  name: Joi.string().min(2).max(120).required(),
  email: Joi.string().email().required(),
  whatsappNumber: Joi.string().max(40).allow('', null)
});

const deleteAccountSchema = Joi.object({
  currentPassword: Joi.string().required()
});

accountRoutes.get('/', asyncHandler(getAccount));
accountRoutes.put('/', validate(accountSchema), asyncHandler(updateAccount));
accountRoutes.delete('/', validate(deleteAccountSchema), asyncHandler(deleteAccount));
