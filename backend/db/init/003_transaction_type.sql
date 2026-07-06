ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS type VARCHAR(20) NOT NULL DEFAULT 'expense';

ALTER TABLE transactions
DROP CONSTRAINT IF EXISTS transactions_type_check;

ALTER TABLE transactions
ADD CONSTRAINT transactions_type_check CHECK (type IN ('income', 'expense'));
