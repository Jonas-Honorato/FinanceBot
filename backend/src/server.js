import { createApp } from './app.js';
import { env } from './config/env.js';
import { runMigrations } from './db/runMigrations.js';

await runMigrations();

const app = createApp();
app.listen(env.apiPort, () => {
  console.log(`FinanceBot API running on http://localhost:${env.apiPort}`);
});
