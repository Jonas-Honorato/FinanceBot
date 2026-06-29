import { Router } from 'express';
import { byCategory, comparisonByCategory, dailySummary, monthlySummary, todaySummary } from '../controllers/summaryController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

export const summaryRoutes = Router();

summaryRoutes.get('/monthly', asyncHandler(monthlySummary));
summaryRoutes.get('/by-category', asyncHandler(byCategory));
summaryRoutes.get('/daily', asyncHandler(dailySummary));
summaryRoutes.get('/today', asyncHandler(todaySummary));
summaryRoutes.get('/comparison', asyncHandler(comparisonByCategory));
