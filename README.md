# TradeCar · Loja e central de operação

A loja mantém o visual original, com fotos enquadradas, versões WebP e navegação própria para celular. O painel gerencia veículos, peças, fichas, vendas, financeiro, atendimento e divulgação sobre uma base persistente.

## Uso local

Use Node 24 e execute `npm ci`, `npm run build` e `npm start`. A loja fica em http://127.0.0.1:3100/ e o painel em http://127.0.0.1:3100/admin.html. O primeiro acesso cria o administrador. Senhas ficam protegidas por scrypt; sessões usam cookies HttpOnly. O navegador não guarda estoque ou fichas em localStorage.

Copie `.env.example` para `.env` e preencha a conexão MongoDB Atlas. A base própria é `tradecar_shop`; a migração prepara índices e regras de atendimento. SQLite atende somente desenvolvimento local. A hospedagem recusa usar armazenamento temporário como base de produção.

## Publicação na Vercel

O projeto é `vagner`, com domínio https://www.tradecarshop.com.br/. O arquivo `vercel.json` define a construção e a pasta pública. Configure Node 24 nas opções do projeto.

Nas variáveis protegidas da Vercel, salve `MONGO_URI`, `MONGO_DB_NAME=tradecar_shop`, `SITE_URL=https://www.tradecarshop.com.br` e `CRON_SECRET`. Não copie segredos para arquivos públicos. Se a primeira conta já foi criada no painel local conectado ao Atlas, ela será a mesma conta da hospedagem. Caso contrário, a instalação remota exige `SETUP_TOKEN`, que deve ser removido depois de criar a conta.

O estoque anterior pode ser importado pelo painel como rascunho. Revise disponibilidade, preço, documentação e fotos antes de publicar cada item. Os dados usados nos testes locais são fictícios e ficam fora da base da operação.

## Atendimento e divulgação

- O WhatsApp comercial é (13) 99620-2124. Fichas do site ficam no banco e abrem uma conversa com os dados preenchidos.
- O bot usa a API oficial do WhatsApp: configure `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN` e `META_APP_SECRET` nas variáveis da hospedagem. O webhook é `/api/webhooks/whatsapp`, com assinatura verificada. Fora da janela de atendimento, o envio livre fica bloqueado. O atendimento pode passar para uma pessoa e as respostas podem ser personalizadas no painel.
- Facebook e Instagram exigem página, conta profissional vinculada e permissões oficiais: `META_PAGE_ID`, `META_PAGE_ACCESS_TOKEN`, `INSTAGRAM_ACCOUNT_ID` e `META_GRAPH_VERSION`. As publicações começam em rascunho e podem ser agendadas. Produtos indisponíveis bloqueiam novos envios.
- A conta Metricool exclusiva usa a marca `7366782`. Conecte os perfis nessa conta; o conector que estava conectado a outro projeto não foi usado para escrever conteúdo.
- A execução recorrente está em `.github/workflows/process-jobs.yml`. Configure o segredo `TRADECAR_CRON_SECRET` igual ao `CRON_SECRET` da Vercel. O agendador executa na branch principal; o GitHub pode atrasar execuções. O painel informa tarefas enviadas, recusadas ou de resultado incerto, sem reenviar automaticamente tarefas incertas.

## Fiscal e busca

O módulo fiscal prepara documentos e integra a Focus NFe. Antes de emitir notas reais, a empresa precisa ser habilitada no emissor e completar seus dados fiscais com a contabilidade. Configure `FOCUS_NFE_TOKEN`; o padrão é homologação. `FOCUS_NFE_PRODUCTION=true` habilita produção. O comprovante de venda não é nota fiscal.

O domínio fornece `/sitemap.xml` e `/robots.txt`, páginas individuais com informações estruturadas e links de campanhas. Cadastre e verifique a propriedade no Google Search Console e no Bing Webmaster Tools, depois envie o sitemap. Isso não garante prazo ou posição nos resultados.

## Verificação

`npm test` verifica acesso, autorização, baixa de estoque, reversão, duplicidade, consentimento, assinatura do webhook e restrições fiscais. `node --env-file=.env scripts/verify-atlas.mjs` verifica a persistência no Atlas com uma base de teste isolada e a remove ao terminar. `npm run build` prepara a versão pública. Faça uma venda de teste somente em ambiente de teste, nunca com itens reais da operação.
