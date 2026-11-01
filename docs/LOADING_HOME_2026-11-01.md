# Loading, espera da Manu e Home — 01/11/2026

Atividade: Issue #19. Branch `feature/loading-manu-home`, criada a partir de `origin/dev@b19bc96`. Pedido do usuário: alterações locais sem abrir PR nesta rodada.

## Mudanças

- `LoadingState` reutiliza a marca FIXA em um anel animado, com rótulo traduzido e `role="status"`. Aplicado à abertura de páginas, verificação da sessão, carregamento de equipe/perfil/calendário, conversas, gráficos e dashboard. Não há atraso artificial para manter o loader na tela.
- Uma borda de Suspense no conteúdo preserva a estrutura da aplicação. A navegação do React Router conserva sua transição normal; na espera de um módulo, pode manter o conteúdo anterior até a troca. Não se desativaram transições globalmente para forçar um loading.
- `ManuThinking` reutiliza a emoção PENSATIVO, com flutuação suave e três pontos animados no balão. Aparece apenas durante a requisição e desaparece ao concluir, inclusive no erro. O log não fica ocupado durante o envio, permitindo o anúncio do estado de espera.
- A animação é desativada com `prefers-reduced-motion`, mantendo rótulo e pontos estáticos. Tema escuro e os quatro idiomas são preservados.
- Home passa a distribuir a altura disponível entre banner e painéis. Dashboard/calendário têm a mesma altura; eventos usam o espaço restante e têm rolagem interna acessível por teclado. Removidas regras conflitantes de alturas fixas do CSS da Home.
- No desktop testado (1024×600, 1024×768, 1280×720, 1366×768, 1440×900 e 1920×900) não houve rolagem vertical externa. Em mobile, zoom e alturas insuficientes, a página continua rolável para não cortar conteúdo. Nenhum `overflow: hidden` global foi usado para mascarar conteúdo.

## Validação

- Formatação, lint, 161 testes de unidade/contrato e build aprovados.
- 38 cenários da suíte de navegador existente aprovados, cobrindo navegação, gerenciamento, chatbot e gráficos.
- 14 verificações direcionadas no Edge: oito tamanhos da Home com 12 eventos, carregamento inicial e conservação da navegação, três cenários da Manu (desktop, mobile, escuro/inglês/movimento reduzido), loading de dados da equipe e SDK controlado do dashboard.
- A lista de eventos pode ser percorrida por teclado. O campo de escrita permanece visível durante a resposta, sem transbordamento horizontal. Movimento reduzido retornou zero animações ativas. O loader do dashboard desaparece após o sinal de pronto do iframe.
- Respostas são controladas no navegador, sem criar conversas/registros na AWS. As capturas não contêm credenciais nem dados de pessoas reais.

## Evidências

- [Medições e resultados](evidencias/loading-home-2026-11-01/resumo.json)
- [Home em 1366×768](evidencias/loading-home-2026-11-01/home-1366.png)
- [Loading centralizado](evidencias/loading-home-2026-11-01/loading-pagina-1440.png)
- [Manu no desktop](evidencias/loading-home-2026-11-01/manu-pensando-1440.png)
- [Manu no mobile](evidencias/loading-home-2026-11-01/manu-pensando-390.png)
- [Manu em tema escuro e movimento reduzido](evidencias/loading-home-2026-11-01/manu-pensando-320-escuro.png)

## Limites

Esta rodada não altera nem homologa API/IA/Databricks. A tela de indisponibilidade do dashboard na captura é simulada para verificar o layout, separada do teste de SDK pronto. As dependências externas do BI continuam registradas nas Issues #14/#16. Sem PR, merge, push em branches permanentes ou publicação nesta rodada.
