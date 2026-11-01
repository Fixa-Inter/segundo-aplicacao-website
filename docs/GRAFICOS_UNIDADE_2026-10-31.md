# Gráficos da Manu e dashboard por unidade — 31/10/2026

Issue #14 · branch `feature/dashboards-unidade-graficos-manu`, criada de `origin/dev` após o merge real do PR #13. Responsável: Gkso31 com apoio do Codex. Estimativa inicial: 90 minutos. Somente a Web foi modificada.

## Atualização: gráficos para RH liberados

Após a atualização da IA informada pelo usuário, a conta RH foi retestada na AWS pela Web em 390 px: login e chat **200**, `plataforma: web`, Bearer presente, gráfico `serie_temporal` da **unidade 1**. O gráfico renderizou, foi persistido no histórico e reapareceu após recarregar; sem erros JS nem overflow horizontal. A conversa criada exclusivamente para QA foi removida com **200**. Não foram criados ou alterados registros operacionais.

A liberação não exigiu alterações no código Web. Evidências: [resultado real](evidencias/graficos-unidade-2026-10-31/aws-rh-liberado.json) e [gráfico no celular](evidencias/graficos-unidade-2026-10-31/aws-rh-liberado-390.png). A antiga recusa de RH abaixo é um registro da primeira verificação, superado por esta atualização. O teste do endpoint de dashboard/BI é separado desta correção.

## Contratos conferidos

- API Web `main`: `1830ee1f0f0ebc5a519bb820cf750de199071fb5`; `GET /api/v1/perfil` agora informa `unidadeId`.
- `GET /api/v1/dashboard/embed`, Bearer, sem corpo ou unidade fornecida pelo navegador: `{ instanceUrl, workspaceId, dashboardId, token, expiresIn }`. O backend deriva a unidade do usuário e emite o token Databricks com `external_value`.
- IA `main`: `ac9bdfcfd7b6685a9b51ee3eeea03c7161da4441`; `POST /api/v1/chat` exige `plataforma: "web"`. Esses SHAs identificam os fontes consultados; o deploy não expõe seu SHA.
- `visualizacao` é opcional na resposta e nas mensagens do histórico. Versão `1.0`, dados nos formatos `categorias`, `serie_temporal`, `histograma` e `boxplot`; os grupos de boxplot podem ser `boxplot`, `resumo` ou `sem_base`. Não há HTML/JSX executável no contrato.

## Implementação Web

O chatbot usa Recharts, carregado sob demanda, com gráficos redimensionáveis, valores localizados, tooltips e uma tabela acessível por gráfico. Séries com lacunas permanecem nulas; períodos parciais, avisos e cobertura da base são preservados. Histogramas respeitam os limites dos intervalos; boxplots exibem quartis, bigodes e extremos informados. Grupos pequenos mostram suas estatísticas na tabela, sem inventar quartis. O texto da resposta permanece legível quando a visualização não é válida.

Antes de apresentar dados, a Web confere a unidade da visualização com `unidadeId` do perfil autenticado, além de versão, datas, números finitos, contagens, quartis e limites de volume do contrato. Esse controle de apresentação complementa a autorização da IA; não a substitui. Gráficos voltam em uma nova instância pelo histórico remoto, sem depender do cache anterior. Logout durante a conferência não recria o cache de uma sessão encerrada.

Home, Dashboard e ficha de técnico usam o endpoint de acesso da API e `@databricks/aibi-client`. O SDK recebe somente o token escopado, renova pelo backend e é destruído na troca/desmontagem da sessão. O destino é validado como origem HTTPS Databricks sem credenciais/caminhos injetados. O painel de filtros globais é desabilitado. O widget e o filtro nominal de técnico são apenas seleção visual, sem pretensão de controle de acesso. Não existe fallback para um iframe geral, nem link que abra o dashboard geral fora do contexto autorizado.

Serviços e DTOs ficam separados da UI; o componente consome um hook de acesso, conforme a regra de camadas do lint. `.env`, builds e `node_modules` permanecem ignorados. Apenas configurações públicas são versionadas.

## Verificações reais AWS

- Login e perfil: Gestor e RH **200**, unidades **7** e **1**, respectivamente.
- Histórico da IA: **200** para os dois perfis.
- Gestor: gráfico real de solicitações por mês **200**, `plataforma: web`, visualização `serie_temporal`, unidade **7**. Renderizou pela Web e voltou após reload; zero erros JS e sem overflow horizontal. Resposta e histórico preservaram o gráfico.
- RH: chat **200**, mas a IA respondeu **“Seu perfil nao possui permissao para gerar visualizacoes gerenciais.”**, sem `visualizacao`. O texto foi exibido normalmente. O usuário confirmou que RH deve gerar gráficos e que essa liberação ainda não foi implementada na IA. A Web está preparada; a recusa permanece uma dependência externa.
- Dashboard: `GET /api/v1/dashboard/embed` respondeu **502** para os dois perfis. A Web mostra indisponibilidade e retry; não abre um painel de outra unidade.
- As conversas criadas exclusivamente para QA foram removidas pelo identificador retornado, com **200**. Nenhum cadastro operacional foi criado, editado ou excluído.

## Validação e evidências

Veja os JSONs e capturas em [evidências](evidencias/graficos-unidade-2026-10-31/). As telas de categorias/histograma/boxplot e a autorização/renovação SDK usam respostas controladas; o gráfico temporal do Gestor e os status AWS acima são verificações reais. Os dois contextos não devem ser confundidos.

O audit de produção terminou com **0 vulnerabilidades reportadas**. Patches compatíveis atualizaram Vite para 8.3.5, source-map-js e zod, removendo os três alertas altos observados na instalação. Permanecem 12 alertas moderados da cadeia ESLint de desenvolvimento; não foi forçado downgrade/alteração maior. Audit não é certificação completa de segurança.

## Pendências para homologar o BI e concluir a entrega

1. API/AWS: investigar o **502 de `/api/v1/dashboard/embed`**; conferir a configuração Databricks e os logs da troca OAuth/tokeninfo. As credenciais devem continuar somente no servidor.
2. BI: confirmar que **todas as consultas do dashboard restringem `unidade_id` com `__aibi_external_value`**, inclusive ao remover/alterar filtros visuais. O token entrega o contexto; a consulta precisa aplicá-lo. O 502 impediu esta homologação real.
3. **Resolvido:** geração de gráficos para RH liberada na IA e confirmada na Web, conforme atualização e evidências acima.
4. Promoção `dev → hml → main`, aprovação e publicação Vercel seguem o fluxo da organização; não foram realizadas nesta atividade. Project permanece dependente de acesso, sem status de conclusão presumido.

Não é correto declarar a Web 100% homologada enquanto esses testes externos estiverem pendentes.

## Referências primárias

- [Databricks: embedding com token e contexto de usuário](https://docs.databricks.com/aws/en/dashboards/share/embedding/external-embed).
- [Recharts: dimensões responsivas](https://recharts.github.io/en-US/guide/sizes/).
- Contratos versionados nos repositórios da equipe e fontes instalados do SDK; sem alterações na API Web ou IA.

## Resultado final local

Formatação, lint, **161 testes de unidade/contrato**, **38 cenários de navegador** e build aprovados. Após o ajuste final de rótulos/tema, os **7 cenários de gráficos/SDK** foram reconferidos com sucesso, incluindo RH com dados controlados. O SDK foi validado com renovação, painel global desabilitado e ausência do token escopado nos storages.

Início observado: 31/10/2026 às 16h28m37s (America/Sao_Paulo). Registro de evidências: 30.7 minutos observados; estimativa inicial 90 minutos. Abertura de PR e CI subsequentes ficam registrados no GitHub.

Nova verificação de RH: início observado 31/10/2026 às 17h30m51s (America/Sao_Paulo); registro da evidência em 2026-10-31T20:32:41.979638+00:00. Tempo medido até o registro: 1.8 minutos. Sem alterações de código de aplicação.
