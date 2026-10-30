# Imagens no histórico da Manu — correção validada em 30/10/2026

Continuação da [Issue #12](https://github.com/Fixa-Inter/segundo-aplicacao-website/issues/12), responsável Gkso31 com apoio do Codex. Branch `feature/integracao-ia-manu`, base `9f01be1`. Estimativa: 30 minutos.

## Resultado

**INT-02 resolvido na integração atual.** A IA publicada agora retorna `mensagens[].imagens` nas duas rotas de histórico. A Web foi adaptada para recuperar e exibir as imagens depois de recarregar ou reabrir a conversa.

O OpenAPI de `https://ia-api.fixa.solutions` passou a declarar `imagens` como array de strings ou null em `MensagemHistorico`. Foi consultado o código da IA em `main`, SHA `42d0f7e86742f6257d85ce5352b21fd564f0667b`. A implantação não expõe o SHA; as respostas reais da AWS são a evidência do contrato publicado.

## Ajustes da Web

- O DTO e o adaptador de histórico agora leem `imagens`, em vez de inicializar todos os anexos como vazios.
- A reconciliação usa as imagens recebidas do servidor. Um cache antigo sem anexos não apaga as URLs persistidas.
- Mensagens sem o campo, com null ou sem imagens continuam acessíveis. URLs incompatíveis são ignoradas sem esconder o texto; os links exibidos passam pela validação existente de HTTP/S, credenciais, fragmento e tamanho.
- Mantida a recuperação por lista e pela consulta específica, sem criar uma cópia paralela do histórico no navegador.

## Teste real antes/depois

Dois testes independentes com a Web real, Edge, conta de Gestor, upload Cloudinary e IA AWS. Usado PNG sintético azul de 256×256, sem dados pessoais.

| Verificação | Consumidor anterior | Web corrigida |
| --- | --- | --- |
| Upload no Cloudinary | 200 | 200 |
| POST `/api/v1/chat`, com a URL do upload | 200 | 200 |
| POST `/api/v1/sessoes/conversa` | 200, URL em `mensagens.0.imagens.0` | 200, URL em `mensagens.0.imagens.0` |
| GET `/api/v1/sessoes` | 200, mesma URL no chat de QA | 200, mesma URL no chat de QA |
| Imagem na Web antes do reload | 1 | 1 |
| Imagem após recarregar/reabrir | 0 | **1** |
| Remoção da conversa de QA | 200 | 200 |

Os chats de teste foram removidos. Não foram criadas solicitações, OS ou outros registros operacionais. A verificação não consulta diretamente o banco. Os pequenos arquivos sintéticos permanecem no Cloudinary, pois o upload não retornou credencial de exclusão.

## Validação

- `npm run format:check`, `npm run lint`, `npm test` e `npm run build`: aprovados.
- **146 testes de unidade/contrato aprovados**, quatro novos casos. Três desses casos falharam antes do ajuste e passaram depois; o quarto confirma compatibilidade com mensagens sem imagens/null.
- **31 testes de navegador aprovados**, dois novos casos. Gestor em 1440px e RH em 390px conservam duas imagens após reload e depois de salvar/reabrir a conversa.
- A suíte também conferiu envio/upload, confirmação/correção, exclusão, recuperação de erros e os demais fluxos móveis existentes.
- Inspecionadas as capturas reais antes/depois do reload e as capturas controladas de desktop/celular.
- `git diff --check`: aprovado.

A suite de navegador usa serviços controlados para os fluxos gerais; o teste real da tabela usa AWS/Cloudinary. A restauração dos anexos não comprova que o modelo analisou corretamente a imagem nem homologa as ferramentas de criação da IA.

Mensagens antigas sem URL disponível continuam exibindo seu texto. A Web não consegue reconstruir uma imagem que o histórico não forneça.

## Evidências e registro

- [Resultados e tempo medido](evidencias/manu-imagem-corrigida-2026-10-30/resumo.json).
- [AWS com consumidor anterior](evidencias/manu-imagem-corrigida-2026-10-30/aws-before.json).
- [AWS depois da correção da Web](evidencias/manu-imagem-corrigida-2026-10-30/aws-after.json).
- [Histórico com duas imagens em 390px](evidencias/manu-imagem-corrigida-2026-10-30/manu-imagens-historico-390.png).
- [Histórico com duas imagens em 1440px](evidencias/manu-imagem-corrigida-2026-10-30/manu-imagens-historico-1440.png).

Início observado: 30/10/2026 às 12h23m02s. Registro: 12h30m30s, America/Sao_Paulo. Tempo observado até o registro: **7.5 minutos**.

Continuação na branch de integração existente, sem novo PR, merge ou deploy. A Issue permanece aberta; o status do Project não foi presumido.
