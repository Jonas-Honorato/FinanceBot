INSERT INTO users (id, name, email, password_hash, whatsapp_number)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Demo User',
  'demo@financebot.dev',
  '$2a$10$Fdv7YG1PFG9ipj9w7F4Xfevl/Yv/plSN9KLqoMApT2QvxOirrKAly',
  'whatsapp:+5561998392309'
) ON CONFLICT (email) DO NOTHING;

INSERT INTO transactions (user_id, amount, category, description, date, created_via)
VALUES
('11111111-1111-1111-1111-111111111111', 45.00, 'Alimentação', 'supermercado', CURRENT_DATE - INTERVAL '1 day', 'whatsapp'),
('11111111-1111-1111-1111-111111111111', 22.00, 'Transporte', 'Uber', CURRENT_DATE - INTERVAL '2 days', 'whatsapp'),
('11111111-1111-1111-1111-111111111111', 1500.00, 'Moradia', 'aluguel', DATE_TRUNC('month', CURRENT_DATE), 'manual'),
('11111111-1111-1111-1111-111111111111', 38.50, 'Lazer', 'Pizza', CURRENT_DATE, 'whatsapp')
ON CONFLICT DO NOTHING;

INSERT INTO budgets (user_id, category, limit_amount, month, year)
VALUES
('11111111-1111-1111-1111-111111111111', 'Alimentação', 900, EXTRACT(MONTH FROM CURRENT_DATE)::INT, EXTRACT(YEAR FROM CURRENT_DATE)::INT),
('11111111-1111-1111-1111-111111111111', 'Transporte', 400, EXTRACT(MONTH FROM CURRENT_DATE)::INT, EXTRACT(YEAR FROM CURRENT_DATE)::INT),
('11111111-1111-1111-1111-111111111111', 'Moradia', 1800, EXTRACT(MONTH FROM CURRENT_DATE)::INT, EXTRACT(YEAR FROM CURRENT_DATE)::INT)
ON CONFLICT (user_id, category, month, year) DO NOTHING;
