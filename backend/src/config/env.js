import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env'), override: false });

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPort: Number(process.env.PORT || process.env.API_PORT || 4000),
  dbProvider: process.env.DB_PROVIDER || 'postgres',
  pgliteDataDir: process.env.PGLITE_DATA_DIR || './data/pglite',
  databaseUrl: process.env.DATABASE_URL || 'postgres://financebot:financebot@localhost:5432/financebot',
  databaseSsl: process.env.DATABASE_SSL === 'true',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  publicDashboardUrl: process.env.PUBLIC_DASHBOARD_URL || process.env.FRONTEND_URL || 'http://localhost:5173',
  whatsappProvider: process.env.WHATSAPP_PROVIDER || 'mock',
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
  twilioWhatsappFrom: process.env.TWILIO_WHATSAPP_FROM || '',
  metaWhatsappToken: process.env.META_WHATSAPP_TOKEN || '',
  metaPhoneNumberId: process.env.META_PHONE_NUMBER_ID || '',
  metaVerifyToken: process.env.META_VERIFY_TOKEN || '',
  metaGraphApiVersion: process.env.META_GRAPH_API_VERSION || 'v20.0'
};
