# Conferência real de imagem no histórico da Manu — 30/10/2026

Continuação da [Issue #12](https://github.com/Fixa-Inter/segundo-aplicacao-website/issues/12), responsável Gkso31 com apoio do Codex. Base `db4180e`, branch `feature/integracao-ia-manu`. Estimativa: 20 minutos.

## Resultado

O envio funciona. A recuperação da imagem após recarregar ainda não funciona na implantação consultada em `https://ia-api.fixa.solutions`.

O teste usou a Web real, Edge, conta de Gestor e um PNG sintético azul de 256×256. O arquivo foi enviado pelo uploader configurado, sem mocks de upload/chat/histórico.

| Verificação | Resultado |
| --- | --- |
| Login da API Web | 200 |
| Upload real no Cloudinary | 200; URL retornada |
| POST `/api/v1/chat` com a mesma URL no array `imagens` | 200 |
| Imagem visível na mensagem antes do reload | 1 |
| POST `/api/v1/sessoes/conversa` do chat de teste | 200, sem a URL |
| GET `/api/v1/sessoes`, conferindo somente o chat de teste | 200, sem a URL |
| Recarregar a Web e abrir novamente o chat | 0 imagens |
| Remover o chat de teste | 200 |

A mensagem do usuário recebida no histórico contém apenas `role`, `mensagem` e `confirmacao`. A resposta da Manu adiciona `emocao`. Nenhum campo da conversa retornada contém a URL enviada ao Cloudinary, inclusive no texto das mensagens. Portanto, não se trata somente de um campo de imagem que a Web deixou de ler nesta verificação.

Na execução visual final, a resposta da Manu também afirmou “Não recebi nenhuma imagem nesta mensagem”, embora a requisição tenha levado a URL retornada do Cloudinary. Isso é um comportamento observado, sem conclusão sobre a causa no roteamento/análise da IA. HTTP 200 no envio não comprova que o modelo analisou a imagem.

O OpenAPI publicado também não declara imagens em `MensagemHistorico`. Foram consultados `app/schemas/sessao.py` e `app/services/sessoes/historico.py` nas branches `main` e `dev` do repositório da IA. O modelo não expõe imagens e `_formatar_mensagens` não as copia para o retorno. A leitura do código complementa, sem substituir, o teste da AWS.

## O que alinhar com a IA

Confirmar em qual rota e ambiente a recuperação foi implementada. Para a Web exibir o anexo depois de recarregar, ambas as rotas de histórico precisam devolver as URLs de cada mensagem — por exemplo, `mensagens[].imagens: string[]`. A persistência interna ou o envio ao modelo, isoladamente, não disponibilizam a miniatura à interface. Esta verificação não inspecionou o banco e não conclui se a URL está ou não persistida internamente.

Nenhum código da aplicação ou da IA foi modificado nesta conferência. Foram registrados o teste real e as evidências. Não foi criada uma cópia paralela do histórico no navegador.

## Evidências e execução

- [Resultado sanitizado](evidencias/manu-imagem-historico-2026-10-30/resultado.json).
- [Imagem antes de recarregar](evidencias/manu-imagem-historico-2026-10-30/antes-reload.png).
- [Mesma conversa após recarregar](evidencias/manu-imagem-historico-2026-10-30/depois-reload.png).

As duas primeiras execuções de QA consultaram corretamente as duas rotas, mas a tentativa de reabrir pelo timestamp original falhou: o guardrail da IA tratou os dígitos do teste como telefone e os anonimizou. O seletor da terceira execução passou a usar o título realmente retornado, concluindo o fluxo visual. Isso era uma limitação do script de teste, sem mudança no produto. As três conversas de teste foram removidas com 200. Os três pequenos arquivos sintéticos de QA permanecem no Cloudinary; o upload não retornou credencial de exclusão.

Início observado: 30/10/2026 às 07h33m37s. Registro: 07h41m47s, America/Sao_Paulo. Tempo observado: **8.2 minutos**.

Sem novo PR, merge ou deploy. A Issue e o Project não foram marcados como finalizados.
