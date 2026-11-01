# Revisão após reorganização — 26/10/2026

Revisão da base 3e80923, na feature/integracao-ia-manu. Atividade registrada antes das alterações na [Issue #12](https://github.com/Fixa-Inter/segundo-aplicacao-website/issues/12#issuecomment-6431281128).

## Problemas reproduzidos e corrigidos

| Problema                                                               | Efeito anterior                                                                               | Correção                                                                                                                            |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Desativar e reativar a mesma consulta                                  | Opções antigas reapareciam com loading falso antes da nova resposta.                          | Identidade da leitura considera ativação, fonte, tentativa e mensagem alternativa; resultados antigos não pertencem à nova leitura. |
| Carregador lança antes de devolver Promise                             | A exceção escapava do efeito e podia desmontar a interface.                                   | Execução inteira protegida por try/catch, com erro tratado no estado.                                                               |
| Trocar técnico ou passar para cadastro novo na mesma instância do hook | Competências anteriores continuavam visíveis durante a próxima leitura ou no cadastro sem ID. | Hook de competências usa o carregamento comum; troca de ID limpa a exibição e cadastro novo recebe dez categorias sem nota.         |

O cancelamento foi preservado. Não houve mudança de endpoints, permissões, formato das notas ou criação de cache global.

[useResourceOptions](../src/hooks/useResourceOptions.ts) concentra loading/erro/repetição/cancelamento; [useTechnicianCompetencies](../src/hooks/useTechnicianCompetencies.ts) fornece a consulta e as categorias vazias; [types/resources](../src/types/resources.ts) mantém os contratos tipados. useMemo estabiliza a identidade, sem constituir comprovação do extra de desempenho por Profiler.

## Testes e evidências

Os [oito testes permanentes](../tests/browser/resource-options.test.mjs) executam os hooks reais em [página isolada](../tests/browser/resource-options.html). Antes: **quatro passaram e quatro falharam**. Depois: **oito passaram**:

- Reativação da mesma fonte.
- Troca de fonte e resposta atrasada.
- Erro desconhecido, nova tentativa e sucesso.
- Desmontagem, abort e ausência de atualização posterior.
- Exceção síncrona.
- Ciclo duplo de efeitos do StrictMode.
- Troca entre técnicos com notas diferentes.
- Retorno para cadastro novo sem notas.

O fixture usa token fictício e intercepta consultas; conexões externas não simuladas são bloqueadas. Não exige conta real nem substitui o hook por uma implementação simulada.

| Verificação final          | Resultado                                                                                                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| format:check, lint e build | Aprovados.                                                                                                                                                                        |
| npm test                   | 117 aprovados, zero falhas.                                                                                                                                                       |
| npm run test:browser       | 8 aprovados, zero falhas, em execução separada.                                                                                                                                   |
| QA dos formulários         | Troca rápida de unidade, repetição após falha, cadastro parcial sem duplicação, nota decimal, erro/repetição de evento e descarte no celular aprovados com contratos controlados. |
| Acessibilidade dirigida    | Sete estados desses formulários sem violações axe detectadas ou transbordamento; não certifica WCAG integral.                                                                     |
| Estrutura                  | 118 fontes TS/TSX, zero any, zero services importados em componentes, zero fetch nas views e 21 efeitos com dependências explícitas.                                              |

[Resumo versionado](evidencias/revisao-estrutura-2026-10-26/resumo.json). Logs locais em dev.local/post-refactor-review, ignorado pelo Git.

## Reprodução e limites

Com npm run dev em execução, rode npm run test:browser em outro terminal. Requer Playwright e navegador disponíveis; se o módulo for externo, informe FIXA_PLAYWRIGHT_MODULE com o caminho do index.mjs. FIXA_TEST_BASE_URL e FIXA_TEST_BROWSER_CHANNEL são opcionais. Windows usa Edge por padrão; outros sistemas, o Chromium do Playwright. Use a configuração de API do README; as consultas são interceptadas.

Os fixtures estão fora das entradas do build de produção; o bundle foi verificado sem seu código/token fictício. Esta rodada não executou gravações reais nem voltou a homologar AWS, BI, publicação ou leitor de tela completo. As demais pendências continuam na [matriz de DAD](MATRIZ_REQUISITOS.md).

Sem novo PR, merge, deploy ou alteração de backend. A branch existente preserva a integração ainda não promovida. Aprovação e estado do Project não foram simulados.
