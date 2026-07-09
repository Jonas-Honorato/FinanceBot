import { Router } from 'express';

export const legalRoutes = Router();

const contactEmail = 'dionisionunes94@gmail.com';
const updatedAt = 'July 9, 2026';

function renderLegalPage(title, sections) {
  const content = sections
    .map(
      ({ heading, paragraphs }) => `
        <section>
          <h2>${heading}</h2>
          ${paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join('')}
        </section>
      `,
    )
    .join('');

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title} - FinanceBot</title>
    <style>
      :root {
        color-scheme: light;
        font-family: Arial, sans-serif;
        color: #17202a;
        background: #f6f8fb;
      }

      body {
        margin: 0;
      }

      main {
        width: min(760px, calc(100% - 32px));
        margin: 0 auto;
        padding: 48px 0;
      }

      h1 {
        margin: 0 0 8px;
        font-size: 32px;
        line-height: 1.2;
      }

      h2 {
        margin: 28px 0 8px;
        font-size: 18px;
      }

      p {
        margin: 0 0 12px;
        line-height: 1.6;
      }

      .updated {
        color: #52616f;
        margin-bottom: 28px;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>${title}</h1>
      <p class="updated">Ultima atualizacao: ${updatedAt}</p>
      ${content}
    </main>
  </body>
</html>`;
}

legalRoutes.get('/privacy', (_req, res) => {
  res.type('html').send(
    renderLegalPage('Politica de Privacidade', [
      {
        heading: 'Dados coletados',
        paragraphs: [
          'O FinanceBot coleta os dados informados pelo usuario para operar a conta, incluindo nome, email, numero de WhatsApp, mensagens enviadas ao bot, lancamentos financeiros, metas, orcamentos e configuracoes da conta.',
          'As senhas sao armazenadas em formato protegido por hash. O conteudo financeiro e usado apenas para organizar, consultar e resumir as informacoes solicitadas pelo usuario.',
        ],
      },
      {
        heading: 'Uso dos dados',
        paragraphs: [
          'Os dados sao usados para autenticar o usuario, registrar transacoes, responder comandos pelo WhatsApp, gerar resumos financeiros e manter o funcionamento do servico.',
          'O FinanceBot esta em fase beta e pode ser ajustado conforme os testes do produto evoluem.',
        ],
      },
      {
        heading: 'Compartilhamento',
        paragraphs: [
          'O FinanceBot usa provedores de infraestrutura e comunicacao necessarios para entregar o servico, incluindo Render para hospedagem e Meta WhatsApp Cloud API para envio e recebimento de mensagens.',
          'Os dados nao sao vendidos. O compartilhamento ocorre somente quando necessario para operar o produto ou cumprir obrigacoes legais.',
        ],
      },
      {
        heading: 'Retencao e exclusao',
        paragraphs: [
          'Os dados sao mantidos enquanto a conta estiver ativa ou enquanto forem necessarios para operar o servico.',
          'O usuario pode solicitar ou realizar a exclusao da conta e dos dados associados seguindo as instrucoes em /data-deletion.',
        ],
      },
      {
        heading: 'Contato',
        paragraphs: [`Para duvidas sobre privacidade, entre em contato pelo email ${contactEmail}.`],
      },
    ]),
  );
});

legalRoutes.get('/terms', (_req, res) => {
  res.type('html').send(
    renderLegalPage('Termos de Servico', [
      {
        heading: 'Uso do FinanceBot',
        paragraphs: [
          'O FinanceBot e um assistente financeiro pessoal em fase beta. O usuario pode registrar gastos, receitas, metas e consultar resumos pelo painel ou pelo WhatsApp.',
          'Ao usar o servico, o usuario concorda em fornecer informacoes verdadeiras e em manter a seguranca de suas credenciais.',
        ],
      },
      {
        heading: 'Limitacoes',
        paragraphs: [
          'O FinanceBot organiza informacoes financeiras, mas nao substitui aconselhamento financeiro, contabil, juridico ou tributario profissional.',
          'Durante o beta, funcionalidades podem mudar, falhar temporariamente ou ser removidas conforme a evolucao do produto.',
        ],
      },
      {
        heading: 'Responsabilidade',
        paragraphs: [
          'O usuario e responsavel pelas decisoes tomadas com base nas informacoes registradas no produto.',
          'O FinanceBot se esforca para manter o servico disponivel e seguro, mas nao garante disponibilidade continua ou ausencia total de erros.',
        ],
      },
      {
        heading: 'Contato',
        paragraphs: [`Para duvidas sobre estes termos, entre em contato pelo email ${contactEmail}.`],
      },
    ]),
  );
});

legalRoutes.get('/data-deletion', (_req, res) => {
  res.type('html').send(
    renderLegalPage('Exclusao de Dados', [
      {
        heading: 'Como excluir seus dados',
        paragraphs: [
          'O usuario pode excluir a conta pelo painel do FinanceBot, na area de configuracoes da conta, usando a opcao de excluir conta.',
          'A exclusao remove os dados associados a conta, incluindo lancamentos financeiros, metas, orcamentos, numero de WhatsApp vinculado e registros de mensagens do WhatsApp mantidos pelo FinanceBot.',
        ],
      },
      {
        heading: 'Solicitacao por email',
        paragraphs: [
          `Se nao conseguir acessar a conta, envie uma solicitacao para ${contactEmail} usando o email associado a conta ou informando o numero de WhatsApp cadastrado.`,
          'A solicitacao sera analisada e processada em prazo razoavel, conforme a disponibilidade do beta.',
        ],
      },
    ]),
  );
});
