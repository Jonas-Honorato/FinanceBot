import { closePool, query } from './pool.js';

await query(`
  INSERT INTO transactions (user_id, amount, category, description, date, created_via)
  VALUES
  ('11111111-1111-1111-1111-111111111111', 82.40, 'Alimentação', 'compras da semana', CURRENT_DATE, 'manual'),
  ('11111111-1111-1111-1111-111111111111', 64.90, 'Saúde', 'farmácia', CURRENT_DATE - INTERVAL '3 days', 'manual')
`);

console.log('Seed completed');
await closePool();
