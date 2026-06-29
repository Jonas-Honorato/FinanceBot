import { Router } from 'express';
import { exportCsv, monthlyReport } from '../controllers/reportsController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';

export const reportsRoutes = Router();

reportsRoutes.get('/monthly', asyncHandler(monthlyReport));
reportsRoutes.get('/export-csv', asyncHandler(exportCsv));
