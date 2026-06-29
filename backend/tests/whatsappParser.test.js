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

test('returns friendly error without amount', () => {
  const parsed = parseWhatsAppMessage('almoço no restaurante');

  assert.equal(parsed.ok, false);
  assert.match(parsed.message, /Não consegui identificar o valor/);
});
