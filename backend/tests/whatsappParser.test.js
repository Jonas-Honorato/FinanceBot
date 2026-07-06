import assert from 'node:assert/strict';
import { parseWhatsAppMessage } from '../src/services/whatsappParser.js';

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

function runTests() {
  let failed = 0;

  for (const { name, fn } of tests) {
    try {
      fn();
      console.log(`ok - ${name}`);
    } catch (error) {
      failed += 1;
      console.error(`not ok - ${name}`);
      console.error(error);
    }
  }

  if (failed > 0) {
    console.error(`${failed} parser test(s) failed.`);
    process.exitCode = 1;
  } else {
    console.log(`${tests.length} parser test(s) passed.`);
  }
}

queueMicrotask(runTests);

test('parses natural language transaction with BRL amount', () => {
  const parsed = parseWhatsAppMessage('Gastei R$45,00 no supermercado', '2026-06-23');

  assert.equal(parsed.ok, true);
  assert.equal(parsed.type, 'transaction');
  assert.equal(parsed.amount, 45);
  assert.equal(parsed.category, 'Alimentação');
  assert.equal(parsed.date, '2026-06-23');
});

test('parses food transaction with sushi keyword', () => {
  const parsed = parseWhatsAppMessage('gastei 25 reais com sushi', '2026-06-23');

  assert.equal(parsed.ok, true);
  assert.equal(parsed.type, 'transaction');
  assert.equal(parsed.transactionType, 'expense');
  assert.equal(parsed.amount, 25);
  assert.equal(parsed.category, 'Alimentação');
});

test('parses salary income transaction', () => {
  const parsed = parseWhatsAppMessage('recebi 2500 salario', '2026-06-23');

  assert.equal(parsed.ok, true);
  assert.equal(parsed.type, 'transaction');
  assert.equal(parsed.transactionType, 'income');
  assert.equal(parsed.amount, 2500);
  assert.equal(parsed.category, 'SalÃ¡rio');
  assert.equal(parsed.description, 'salario');
});

test('parses savings goal command', () => {
  const parsed = parseWhatsAppMessage('quero juntar 3000 em 6 meses', '2026-06-23');

  assert.equal(parsed.ok, true);
  assert.equal(parsed.type, 'goal');
  assert.equal(parsed.amount, 3000);
  assert.equal(parsed.months, 6);
  assert.equal(parsed.deadline, '2026-12-23');
});

test('parses goals summary command', () => {
  const parsed = parseWhatsAppMessage('quanto falta para minha meta');

  assert.equal(parsed.ok, true);
  assert.equal(parsed.type, 'goals-summary');
});

test('parses weekly spending plan command', () => {
  const parsed = parseWhatsAppMessage('quanto posso gastar essa semana');

  assert.equal(parsed.ok, true);
  assert.equal(parsed.type, 'spending-plan');
  assert.equal(parsed.period, 'week');
});

test('parses weekly summary command', () => {
  const parsed = parseWhatsAppMessage('resumo da semana');

  assert.equal(parsed.ok, true);
  assert.equal(parsed.type, 'period-summary');
  assert.equal(parsed.period, 'week');
});

test('parses month name summary command', () => {
  const parsed = parseWhatsAppMessage('resumo de junho', '2026-07-01');

  assert.equal(parsed.ok, true);
  assert.equal(parsed.type, 'period-summary');
  assert.equal(parsed.period, 'month');
  assert.equal(parsed.month, 6);
  assert.equal(parsed.year, 2026);
});

test('does not infer housing from gas inside gastei', () => {
  const parsed = parseWhatsAppMessage('gastei 25 reais', '2026-06-23');

  assert.equal(parsed.ok, true);
  assert.equal(parsed.category, 'Outros');
});

test('parses compact transport transaction', () => {
  const parsed = parseWhatsAppMessage('Uber 22 transporte');

  assert.equal(parsed.ok, true);
  assert.equal(parsed.amount, 22);
  assert.equal(parsed.category, 'Transporte');
});

test('parses budget command', () => {
  const parsed = parseWhatsAppMessage('meta 1000 alimentação');

  assert.equal(parsed.ok, true);
  assert.equal(parsed.type, 'budget');
  assert.equal(parsed.amount, 1000);
  assert.equal(parsed.category, 'Alimentação');
});

test('parses period command', () => {
  const parsed = parseWhatsAppMessage('quando começou');

  assert.equal(parsed.ok, true);
  assert.equal(parsed.type, 'period');
});

test('parses help command', () => {
  const parsed = parseWhatsAppMessage('comandos');

  assert.equal(parsed.ok, true);
  assert.equal(parsed.type, 'help');
});

test('parses last transactions command', () => {
  const parsed = parseWhatsAppMessage('ultimos');

  assert.equal(parsed.ok, true);
  assert.equal(parsed.type, 'last-transactions');
});

test('parses delete last transaction command', () => {
  const parsed = parseWhatsAppMessage('apagar ultimo');

  assert.equal(parsed.ok, true);
  assert.equal(parsed.type, 'delete-last-transaction');
});

test('parses correct last category command', () => {
  const parsed = parseWhatsAppMessage('corrigir ultimo alimentacao');

  assert.equal(parsed.ok, true);
  assert.equal(parsed.type, 'correct-last-category');
  assert.equal(parsed.category, 'Alimentação');
});

test('returns friendly error without amount', () => {
  const parsed = parseWhatsAppMessage('almoço no restaurante');

  assert.equal(parsed.ok, false);
  assert.match(parsed.message, /Não consegui identificar o valor/);
});
