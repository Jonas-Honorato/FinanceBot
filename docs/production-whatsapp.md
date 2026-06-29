# FinanceBot API 24h no WhatsApp

Este modo publica somente o backend da API, sem depender da dashboard web.

## Arquitetura recomendada

- Render Web Service: roda `backend` 24h.
- Render PostgreSQL: guarda usuários, transações, metas e logs.
- Twilio WhatsApp Sandbox: chama o webhook público da API.

## Deploy no Render

1. Suba este repositório para o GitHub.
2. No Render, crie um novo **Blueprint** apontando para o repositório.
3. O arquivo `render.yaml` cria:
   - `financebot-api`
   - `financebot-db`
4. Aguarde o deploy concluir.
5. Copie a URL pública do serviço, por exemplo:

```text
https://financebot-api.onrender.com
```

## Configurar a Twilio

No WhatsApp Sandbox da Twilio, configure:

```text
When a message comes in: https://SUA-URL-RENDER/api/webhook/whatsapp
Method: POST
```

Depois entre no sandbox pelo WhatsApp enviando o código `join ...` exibido pela Twilio.

## Comandos do bot

```text
Pizza 38,50
Gastei R$45 no supermercado
resumo
hoje
categoria alimentação
meta 1000 alimentação
relatório
```

## Observações

- O comando `relatório` responde com um resumo textual no WhatsApp.
- A resposta ao WhatsApp usa TwiML direto no webhook, então não precisa de `TWILIO_AUTH_TOKEN` para responder mensagens recebidas.
- Para uso 24h real, evite planos que hibernam o serviço.
