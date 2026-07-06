# FinanceBot API gratuita/teste no WhatsApp

Este modo publica somente o backend da API, sem depender da dashboard web.

## Arquitetura de teste gratuita

- Render Web Service no plano Free: roda `backend`, mas pode hibernar quando ficar sem acessos.
- Render PostgreSQL no plano Free: guarda usuarios, transacoes, metas e logs durante o periodo gratuito/teste.
- Provedor WhatsApp configuravel: `mock`, `twilio` ou `meta`.

Este modo e suficiente para validar o bot sem pagar agora. Depois de hibernar,
a primeira mensagem pode demorar ou falhar porque o servico precisa acordar.

## Deploy no Render

1. Suba este repositorio para o GitHub.
2. No Render, crie um novo **Blueprint** apontando para o repositorio.
3. O arquivo `render.yaml` cria:
   - `financebot-api`
   - `financebot-db`
4. Confirme que ambos estao usando o plano **Free**.
5. Aguarde o deploy concluir.
6. Copie a URL publica do servico, por exemplo:

```text
https://financebot-api.onrender.com
```

## Provedor recomendado

Para usuarios reais, prefira `WHATSAPP_PROVIDER=meta` com a WhatsApp Cloud API oficial da Meta.
O Twilio continua util para sandbox rapido, mas adiciona uma camada comercial e tecnica a mais.

Variaveis da Meta:

```text
WHATSAPP_PROVIDER=meta
META_WHATSAPP_TOKEN=...
META_PHONE_NUMBER_ID=...
META_VERIFY_TOKEN=...
META_GRAPH_API_VERSION=v20.0
```

No painel da Meta, configure:

```text
Callback URL: https://SUA-URL-RENDER/api/webhook/whatsapp
Verify token: mesmo valor de META_VERIFY_TOKEN
```

O endpoint `GET /api/webhook/whatsapp` responde ao desafio de verificacao da Meta.

## Configurar a Twilio para sandbox

No WhatsApp Sandbox da Twilio, configure:

```text
When a message comes in: https://SUA-URL-RENDER/api/webhook/whatsapp
Method: POST
```

Depois entre no sandbox pelo WhatsApp enviando o codigo `join ...` exibido pela Twilio.

## Comandos do bot

```text
Pizza 38,50
Gastei R$45 no supermercado
ajuda
comandos
ultimos
apagar ultimo
corrigir ultimo alimentacao
resumo
resumo da semana
resumo de junho
hoje
periodo
quando comecou
categoria alimentacao
meta 1000 alimentacao
quero juntar 3000 em 6 meses
minhas metas
quanto posso gastar essa semana
relatorio
```

## Observacoes

- O comando `ajuda`, `comandos` ou `menu` lista os comandos principais no WhatsApp.
- O comando `ultimos` mostra os 5 lançamentos mais recentes.
- O comando `apagar ultimo` remove o lançamento mais recente.
- O comando `corrigir ultimo alimentacao` muda a categoria do lançamento mais recente.
- O comando `relatorio` responde com um resumo textual no WhatsApp.
- O comando `resumo da semana` ou `resumo de junho` mostra receitas, gastos e saldo do periodo.
- O comando `periodo` ou `quando comecou` informa a janela mensal usada para contar os gastos.
- O comando `quero juntar 3000 em 6 meses` cria uma meta financeira com prazo.
- O comando `minhas metas` ou `quanto falta para minha meta` mostra o progresso das metas financeiras.
- O comando `quanto posso gastar essa semana` calcula um limite considerando receitas, gastos e metas financeiras.
- A resposta ao WhatsApp usa TwiML direto no webhook, entao nao precisa de `TWILIO_AUTH_TOKEN` para responder mensagens recebidas.
- O plano gratuito do Render pode hibernar depois de alguns minutos sem trafego.
- O Postgres gratuito do Render e indicado para teste e pode expirar; para dados permanentes, migre depois para um banco gratuito externo ou plano pago.
- Para uso 24h real, evite planos que hibernam o servico.
