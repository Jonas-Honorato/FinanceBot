export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'FinanceBot API',
    version: '1.0.0',
    description: 'API para organização financeira pessoal com entrada via WhatsApp.'
  },
  servers: [{ url: 'http://localhost:4000' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
    }
  },
  paths: {
    '/api/auth/register': { post: { summary: 'Cria uma conta de usuário' } },
    '/api/auth/login': { post: { summary: 'Autentica o usuário e retorna JWT' } },
    '/api/webhook/whatsapp': { post: { summary: 'Recebe mensagens do WhatsApp via Twilio/Meta' } },
    '/api/transactions': {
      get: { summary: 'Lista transações com filtros', security: [{ bearerAuth: [] }] },
      post: { summary: 'Cria transação manual', security: [{ bearerAuth: [] }] }
    },
    '/api/summary/monthly': { get: { summary: 'Resumo mensal', security: [{ bearerAuth: [] }] } },
    '/api/summary/by-category': { get: { summary: 'Totais por categoria', security: [{ bearerAuth: [] }] } },
    '/api/summary/daily': { get: { summary: 'Totais por dia', security: [{ bearerAuth: [] }] } },
    '/api/budgets': {
      get: { summary: 'Lista metas', security: [{ bearerAuth: [] }] },
      post: { summary: 'Cria ou atualiza meta', security: [{ bearerAuth: [] }] }
    },
    '/api/reports/monthly': { get: { summary: 'Relatório mensal JSON/PDF', security: [{ bearerAuth: [] }] } },
    '/api/reports/export-csv': { get: { summary: 'Exporta CSV mensal', security: [{ bearerAuth: [] }] } }
  }
};
