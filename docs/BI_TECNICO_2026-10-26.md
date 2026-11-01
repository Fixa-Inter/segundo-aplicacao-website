# Desempenho do técnico por iframe — 26/10/2026

Continuação da [Issue #12](https://github.com/Fixa-Inter/segundo-aplicacao-website/issues/12), branch feature/integracao-ia-manu. A V1 usa Databricks por iframe. A ficha de técnico deixa de chamar o serviço antigo de desempenho e de exibir o aviso aguardando API de BI.

## Contrato publicado e implementação

O gráfico selecionado é **OS criadas por período**, da página OS. A fonte é dashboard_os_criacao e o filtro Técnico publicado referencia tecnico_nome nessa mesma fonte. Os gráficos de finalização e carga ativa usam outras fontes; não são apresentados como filtrados por esse controle.

Configuração pública no .env.example e no ambiente local ignorado pelo Git:

```dotenv
VITE_DATABRICKS_TECHNICIAN_WIDGET=37645ca6~os-criadas-por-periodo
VITE_DATABRICKS_TECHNICIAN_FILTER=f_37645ca6~tecnico1.s
```

VITE_DATABRICKS_DASHBOARD_URL continua definindo o dashboard. O iframe individual abre /embed/dashboardsv3/<dashboard>/pages/37645ca6, escolhe o widget por fullscreenWidget e envia o nome completo do técnico retornado pela API Web no parâmetro f_37645ca6~tecnico1.s. O valor segue a codificação gerada pelo próprio Databricks: encodeURIComponent do texto e depois URLSearchParams. Não são usados o nome truncado da tela, aproximação, apelido ou ID colocado em um filtro de nome.

O ID do técnico remonta o componente ao trocar a ficha. A URL é construída sem alterar a configuração compartilhada da Home/Dashboard. O link externo conserva os filtros e abre a visualização published/pages/<página>; o endereço embed permanece somente no iframe. Configuração ausente ou malformada produz um estado indisponível, sem usar o dashboard geral como alternativa. O seletor antigo de semana/mês foi removido porque não representava um filtro aplicado a dados reais do Databricks.

## Validação e limites

- Filtro nominal confirmado por seleção na interface publicada e pela consulta real: predicado IN no campo tecnico_nome, com o nome selecionado.
- Um teste real com o valor existente no BI, Paulo Henriques, renderizou o gráfico. O carregamento observado levou cerca de 48 segundos; iframe carregado não equivale a consulta concluída.
- Os nomes atuais da API Web e do BI divergem: a base publicada ainda lista Paulo Henriques e Otávia Cardoso, enquanto os cadastros foram editados na Web. Não foi criada uma associação por semelhança. Valores sem correspondência podem produzir No data e precisam de atualização da base do BI.
- A consulta de diagnóstico também encontrou INVALID_PARAMETER_VALUE / Dataset query is not supported em consultas de outros conjuntos. Não foi alterado SQL, dashboard, conta ou publicação para corrigir o provedor.
- Os filtros da URL são seleção de visualização, não um mecanismo de autorização. A sessão/permissões e os controles de navegação do Databricks permanecem.
- Testes do utilitário verificam troca de técnico, nomes com acentos e caracteres reservados, remoção de valor anterior do mesmo filtro, preservação de outras URLs e recusa de configuração malformada. A evidência do navegador fica nos arquivos ignorados dev.local/technician-bi-*.json/png.

## Pendências para a responsável pelo BI

1. Disponibilizar filtro pelo ID numérico do técnico, vinculado ao mesmo ID da API Web, para resistir a alteração de nome e homônimos.
2. Ligar esse filtro também às fontes de OS finalizadas, carga ativa e demais indicadores de desempenho desejados. O filtro atual é de uma fonte específica; um gráfico de outra fonte não foi declarado individualizado.
3. Atualizar os dados publicados após alterações de cadastro e conferir as consultas de dataset não suportadas.

O trabalho é assistido por IA, sem revisão humana, merge ou deploy implícitos. Fontes: [filtros por página/fonte e URLs](https://docs.databricks.com/aws/en/dashboards/manage/filters) e [incorporação de um widget](https://docs.databricks.com/aws/en/dashboards/share/embedding/basic#embed-a-single-widget). Os identificadores e a codificação tipada foram conferidos na instância publicada, não inferidos apenas da documentação.

### Resultado final da ficha real

Em 26/10/2026, aproximadamente 09:36–09:37 (São Paulo), foram abertas as fichas de Paulo e Otávia usando o login Web real e o iframe autenticado do Databricks. Em cada troca, a consulta incluiu o nome completo atual no predicado de tecnico_nome da fonte dashboard_os_criacao. As duas consultas retornaram No data, coerente com os nomes atuais ausentes na publicação; não houve substituição por dados gerais ou aproximação de nomes. A ficha mobile de 390px não teve overflow horizontal. Nenhuma escrita operacional; logout 204. O teste isolado com o nome existente Paulo Henriques renderizou o gráfico real, conforme registro anterior.

Formatação, lint, 101 testes e build passaram na revisão final do código. A saudação da Manu já havia sido validada e enviada separadamente em 606cf5c. O teste das fichas não homologa o cálculo do BI nem a atualização de suas fontes. Os metadados do diagnóstico foram sanitizados para ocultar tokens temporários de resultado e permanecem ignorados pelo Git.
