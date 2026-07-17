import assert from 'node:assert/strict';
import { metaCloudProvider } from '../src/services/whatsapp/providers/metaCloudProvider.js';

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
    console.error(`${failed} Meta Cloud provider test(s) failed.`);
    process.exitCode = 1;
  } else {
    console.log(`${tests.length} Meta Cloud provider test(s) passed.`);
  }
}

queueMicrotask(runTests);

test('extracts a failed delivery status without exposing unrelated webhook data', () => {
  const req = {
    body: {
      entry: [
        {
          changes: [
            {
              value: {
                statuses: [
                  {
                    id: 'wamid.example',
                    status: 'failed',
                    timestamp: '1784258106',
                    recipient_id: '5561998392309',
                    errors: [
                      {
                        code: 131026,
                        title: 'Message undeliverable',
                        message: 'Message undeliverable',
                        error_data: { details: 'Unable to deliver message.' }
                      }
                    ]
                  }
                ]
              }
            }
          ]
        }
      ]
    }
  };

  assert.deepEqual(metaCloudProvider.extractDeliveryStatuses(req), [
    {
      messageId: 'wamid.example',
      status: 'failed',
      timestamp: '1784258106',
      errors: [
        {
          code: 131026,
          title: 'Message undeliverable',
          message: 'Message undeliverable',
          details: 'Unable to deliver message.'
        }
      ]
    }
  ]);
});

test('returns no delivery statuses for an inbound text message', () => {
  const req = {
    body: {
      entry: [
        {
          changes: [
            {
              value: {
                messages: [{ from: '556198392309', text: { body: 'ajuda' } }]
              }
            }
          ]
        }
      ]
    }
  };

  assert.deepEqual(metaCloudProvider.extractDeliveryStatuses(req), []);
});
