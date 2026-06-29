import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { handleWhatsAppWebhook } from '../controllers/webhookController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

export const webhookRoutes = Router();

const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false
});

webhookRoutes.post('/whatsapp', webhookLimiter, asyncHandler(handleWhatsAppWebhook));
