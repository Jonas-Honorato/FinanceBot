# FinanceBot beta real com Meta WhatsApp Cloud API

Este guia prepara uma beta com custo minimo usando Render + Meta WhatsApp Cloud API oficial.
O ambiente local deve continuar com `WHATSAPP_PROVIDER=mock` quando nao houver credenciais reais.

## Arquitetura da beta

- Render Web Service: roda o backend Express.
- Render PostgreSQL: guarda usuarios, transacoes, metas e logs.
- Meta WhatsApp Cloud API: recebe mensagens no webhook e envia respostas por Graph API.

No plano Free do Render, o servico pode hibernar. A primeira mensagem apos um periodo sem uso pode demorar ou precisar ser reenviada.

## 1. Deploy no Render

1. Suba o repositorio para o GitHub.
2. No Render, crie um novo Blueprint apontando para o repositorio.
3. Use o `render.yaml` deste projeto.
4. Confirme o Web Service `financebot-api` e o banco `financebot-db`.
5. Configure as variaveis abaixo no Web Service.

Variaveis obrigatorias no Render:

```text
NODE_ENV=production
DB_PROVIDER=postgres
DATABASE_URL=<preenchido pelo Render a partir do banco>
DATABASE_SSL=false
JWT_SECRET=<gerado pelo Render ou valor forte>
FRONTEND_URL=https://SUA-URL-RENDER
PUBLIC_DASHBOARD_URL=https://SUA-URL-RENDER
WHATSAPP_PROVIDER=meta
META_WHATSAPP_TOKEN=<token permanente ou temporario da Meta>
META_PHONE_NUMBER_ID=<Phone number ID da Meta>
META_VERIFY_TOKEN=<texto secreto criado por voce>
META_GRAPH_API_VERSION=v26.0
```

Se a Meta mostrar uma versao Graph API mais recente no painel, ajuste `META_GRAPH_API_VERSION` para essa versao.

## 2. Configurar a Meta Cloud API

No app da Meta:

1. Adicione o produto WhatsApp.
2. Copie o `Phone number ID` e coloque em `META_PHONE_NUMBER_ID`.
3. Gere/copiei o token de acesso e coloque em `META_WHATSAPP_TOKEN`.
4. Crie um texto secreto para verificacao e coloque o mesmo valor em `META_VERIFY_TOKEN`.
5. Em Webhooks, configure:

```text
Callback URL: https://SUA-URL-RENDER/api/webhook/whatsapp
Verify token: mesmo valor de META_VERIFY_TOKEN
```

6. Assine o campo de mensagens do WhatsApp (`messages`).

O endpoint `GET /api/webhook/whatsapp` responde ao desafio de verificacao da Meta.
O endpoint `POST /api/webhook/whatsapp` recebe mensagens e envia a resposta por Cloud API.

## 3. Como os numeros sao salvos

O FinanceBot normaliza numeros de WhatsApp para:

```text
whatsapp:+55DDDNUMERO
```

Exemplos equivalentes:

```text
11999999999
+5511999999999
55 11 99999-9999
whatsapp:+5511999999999
```

Todos viram:

```text
whatsapp:+5511999999999
```

Isso evita usuarios duplicados quando a pessoa se cadastra pelo painel e depois envia mensagem pela Meta.

## 4. Teste rapido

Depois do deploy:

1. Abra `https://SUA-URL-RENDER/health` e confirme `{"status":"ok"}`.
2. No painel da Meta, envie uma mensagem de teste para o numero do WhatsApp Cloud API.
3. Envie comandos como:

```text
ajuda
sushi 25
resumo
minhas metas
quanto posso gastar essa semana
```

## 5. O que nao esta habilitado nesta etapa

- Lembretes automaticos.
- Templates pagos ou mensagens iniciadas pela empresa fora da janela permitida.
- Pagamentos.
- Landing page publica.
- Twilio para a beta real.

## Referencias oficiais

- Meta Cloud API: https://developers.facebook.com/docs/whatsapp/cloud-api
- Webhooks da Cloud API: https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks
- Envio de mensagens: https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages
