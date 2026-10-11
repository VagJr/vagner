# TradeCar — Guia da operação

Entre no painel com seu acesso principal. O painel local conectado ao Atlas e o site hospedado usam a mesma base da TradeCar.

## Cadastrar carros e peças

Abra **Veículos → Novo veículo** ou **Autopeças → Nova peça**. Informe nome, preço, quantidade e os detalhes do produto. Clique em **Enviar fotos** e selecione os arquivos no computador ou celular. Você pode enviar até 12 fotos JPG, PNG ou WebP; o sistema prepara as imagens para o site.

Escolha **Usar como capa** na foto principal. O botão × remove uma foto da galeria desse cadastro. Clique em **Salvar** para concluir. A situação **Disponível**, junto com quantidade maior que zero, publica o item na loja. **Rascunho** mantém o cadastro somente na gestão. O catálogo anterior foi preservado em rascunho para revisão.

## Atendimento online e WhatsApp

O botão **Atendimento online** da loja abre o assistente automático. Ele responde às perguntas, consulta os produtos publicados e oferece atendimento por ficha ou WhatsApp. Quando o visitante registra a ficha, o painel recebe o interesse e o resumo da conversa, com autorização do visitante.

Em **WhatsApp & bot**, personalize perguntas, palavras-chave, prioridade e respostas. Use **Testar assistente** para conferir o texto sem enviar mensagens reais. No WhatsApp conectado, a equipe pode assumir uma conversa ou retomar o bot.

Quando o responsável pelas contas estiver disponível, abra **Configurações → Conectar os serviços → WhatsApp oficial**. Informe as credenciais do aplicativo Meta e configure o webhook exibido nessa tela. Após conectar e assinar o evento de mensagens, o recebimento e as respostas automáticas usam o mesmo estoque e as mesmas regras do painel. As credenciais salvas ficam criptografadas.

## Fichas, vendas e financeiro

Em **Fichas & clientes**, acompanhe cada atendimento pelas etapas do funil e registre anotações. As fichas da loja identificam campanhas e origem dos contatos.

Em **Vendas & pedidos**, selecione cliente, produtos, quantidade, preço e vencimento. A confirmação baixa o estoque e cria a conta a receber. O pedido pode ser impresso ou salvo em PDF. Em **Financeiro**, acompanhe receitas, despesas e pagamentos. Uma venda já recebida precisa de tratamento financeiro antes do cancelamento.

## Redes sociais

Conecte página e Instagram profissional em **Configurações → Conectar os serviços**. Em **Divulgação & redes**, escolha um produto publicado para criar conteúdo com foto, preço, texto e link de campanha. Revise o rascunho e defina a data de publicação. A fila confere disponibilidade do estoque e registra a confirmação ou falha do serviço.

A opção **Criar rascunhos sociais automaticamente** fica nas Configurações. Ela prepara conteúdo para novos produtos e revisões do catálogo durante o processamento da fila. A conta própria da Metricool também está preparada para conectar os perfis.

## Notas fiscais e busca

**Documentos fiscais** prepara fichas e consulta o emissor Focus NFe conectado. O ambiente inicial é homologação. Para notas reais, o responsável deve habilitar a empresa no emissor, completar os dados tributários e habilitar produção. O pedido ou recibo comercial da gestão não substitui a nota fiscal.

Em **Domínio & busca**, abra as ferramentas do Google e Bing e consulte o sitemap do estoque. Os tokens de verificação por tag HTML podem ser salvos nas Configurações. A verificação das propriedades depende do acesso às contas responsáveis pelo domínio.

## Equipe e backup

Cadastre acessos individuais para administração, atendimento e financeiro. O backup JSON do painel exporta os dados da operação. As fotos enviadas ficam na coleção `images` do Atlas e devem integrar o backup do banco.
