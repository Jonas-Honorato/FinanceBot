import PDFDocument from 'pdfkit';
import { stringify } from 'csv-stringify/sync';
import { query } from '../db/pool.js';
import { getMonthBounds } from '../utils/date.js';
import { formatCurrency } from './whatsappSender.js';

export async function buildMonthlyReport(userId, month, year) {
  const bounds = getMonthBounds(month, year);
  const { rows } = await query(
    `SELECT category, description, amount, date
     FROM transactions
     WHERE user_id = $1 AND date >= $2 AND date < $3
     ORDER BY amount DESC`,
    [userId, bounds.start, bounds.end]
  );

  const total = rows.reduce((sum, row) => sum + Number(row.amount), 0);
  const topFive = rows.slice(0, 5);

  return { month: bounds.month, year: bounds.year, total, topFive, transactions: rows };
}

export function createCsv(transactions) {
  return stringify(transactions, {
    header: true,
    columns: ['date', 'category', 'description', 'amount']
  });
}

export function createMonthlyPdf(report) {
  const doc = new PDFDocument({ margin: 48 });
  const chunks = [];

  doc.on('data', (chunk) => chunks.push(chunk));
  doc.fontSize(20).text(`Relatório mensal - ${report.month}/${report.year}`);
  doc.moveDown();
  doc.fontSize(14).text(`Total gasto: ${formatCurrency(report.total)}`);
  doc.moveDown();
  doc.fontSize(16).text('Top 5 maiores gastos');
  doc.moveDown(0.5);

  report.topFive.forEach((item, index) => {
    doc.fontSize(11).text(`${index + 1}. ${item.description || item.category} - ${item.category} - ${formatCurrency(item.amount)}`);
  });

  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });
}
