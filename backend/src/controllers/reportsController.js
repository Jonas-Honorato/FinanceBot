import { query } from '../db/pool.js';
import { buildMonthlyReport, createCsv, createMonthlyPdf } from '../services/reportService.js';
import { getMonthBounds } from '../utils/date.js';

export async function monthlyReport(req, res) {
  const report = await buildMonthlyReport(req.user.id, Number(req.query.month) || undefined, Number(req.query.year) || undefined);

  if (req.query.format === 'pdf') {
    const pdf = await createMonthlyPdf(report);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=relatorio-${report.month}-${report.year}.pdf`);
    return res.send(pdf);
  }

  res.json(report);
}

export async function exportCsv(req, res) {
  const bounds = getMonthBounds(Number(req.query.month) || undefined, Number(req.query.year) || undefined);
  const { rows } = await query(
    `SELECT date, type, category, description, amount
     FROM transactions WHERE user_id = $1 AND date >= $2 AND date < $3
     ORDER BY date DESC`,
    [req.user.id, bounds.start, bounds.end]
  );

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=transacoes-${bounds.month}-${bounds.year}.csv`);
  res.send(createCsv(rows));
}
