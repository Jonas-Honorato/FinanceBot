import { closePool } from './pool.js';
import { runMigrations } from './runMigrations.js';

await runMigrations();
console.log('Migrations applied');

await closePool();
