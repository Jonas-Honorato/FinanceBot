import test from 'node:test';
import assert from 'node:assert/strict';
import { parseWhatsAppMessage } from '../src/services/whatsappParser.js';

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
  assert.equal(parsed.amount, 25);
  assert.equal(parsed.category, 'Alimentação');
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
