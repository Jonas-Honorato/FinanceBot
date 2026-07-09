import assert from 'node:assert/strict';
import { normalizeWhatsappNumber, whatsappNumberToMetaRecipient } from '../src/utils/whatsappNumber.js';

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
    console.error(`${failed} WhatsApp number test(s) failed.`);
    process.exitCode = 1;
  } else {
    console.log(`${tests.length} WhatsApp number test(s) passed.`);
  }
}

queueMicrotask(runTests);

test('normalizes Brazilian WhatsApp number without country code', () => {
  assert.equal(normalizeWhatsappNumber('(11) 99999-9999'), 'whatsapp:+5511999999999');
});

test('normalizes Brazilian WhatsApp number with country code', () => {
  assert.equal(normalizeWhatsappNumber('55 11 99999-9999'), 'whatsapp:+5511999999999');
});

test('keeps already normalized WhatsApp number stable', () => {
  assert.equal(normalizeWhatsappNumber('whatsapp:+55 11 99999-9999'), 'whatsapp:+5511999999999');
});

test('extracts Meta recipient digits from WhatsApp number', () => {
  assert.equal(whatsappNumberToMetaRecipient('whatsapp:+5511999999999'), '5511999999999');
});

test('returns null for empty values', () => {
  assert.equal(normalizeWhatsappNumber(''), null);
  assert.equal(normalizeWhatsappNumber(null), null);
});
