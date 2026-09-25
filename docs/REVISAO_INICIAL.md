# Revisão da estrutura inicial — 24/09/2026

## Problemas corrigidos no código

1. A logo textual e o painel geométrico do login foram substituídos por PNGs originais do Figma.
2. Tamanhos de texto, campos, espaçamentos e ilustração agora possuem limites e respondem também à altura da janela. Não foi aplicado `overflow: hidden` ao documento.
3. A página de recuperação deixou de ser um aviso de implementação e passou a oferecer o fluxo de demonstração.
4. O menu azul foi trocado pelo menu claro da referência; a Home ganhou banner, composição dos cards e gráfico com escala identificada.
5. Foram removidas as explicações técnicas grandes que ocupavam o formulário de login. As limitações do mock estão no README.
6. Os handlers capturam o valor do input antes da atualização de estado. Os campos ficam desabilitados durante as requisições simuladas.

## Origem dos arquivos

Arquivo Figma: `VeZNU2w9BMTKBpa3z24BxL`. A consulta foi somente leitura.

| Asset | Origem | Dimensão local |
| --- | --- | --- |
| `fixa-logo.png` | Grupo `3914:416` | 200 × 76 |
| `manu-login.png` | Ilustração do frame de login | 658 × 620 |
| `manu-recovery.png` | Nó `3667:81561` | 760 × 760 |

As imagens são imports do Vite e entram no build. O símbolo do menu é exibido por recorte CSS da marca original. Poppins é servida localmente pelo build, sem Google Fonts em tempo de execução.

## Evidências técnicas

- `npm run build`: aprovado, com TypeScript estrito.
- `npm run lint`: aprovado.
- Verificações isoladas com Node/assert: login com campos vazios, normalização da identificação, e-mail inválido, recuperação com código errado/correto, senha curta/válida e cálculo de semanas na virada de mês e ano.
- Arquivos PNG decodificados e dimensões conferidas; imports de imagens resolvidos no build.

Não foram concluídos testes de interface, console do navegador, teclado, leitor de tela ou comparação por screenshot. A política do navegador bloqueou a prévia local. A integração Figma atingiu seu limite durante a coleta de referências. Por esses motivos, esta revisão não deve ser classificada como visualmente idêntica ou QA visual concluído.

## Verificação visual ainda necessária

No DevTools, use zoom de 100% e confira login, recuperação e Home em:

- 1440 × 1024 (referência Figma);
- 1920 × 869 (aproximação da área útil do navegador do print enviado);
- 1366 × 768;
- 1340 × 800 e 800 × 1340 (tablet);
- 360 × 800 e 390 × 844 (celular).

No desktop, confira que os controles do login cabem na área útil sem rolagem. Na recuperação, confira cada etapa. Em janelas baixas, mobile, teclado virtual ou zoom elevado, a rolagem deve continuar disponível quando necessária para alcançar os controles. Não esconder conteúdo para fazer a barra de rolagem desaparecer.

Confira também:

1. Logo e Manu visíveis, sem distorção, erros 404 ou requisições a assets temporários do Figma.
2. Enviar login vazio mostra os erros junto aos campos; mostrar senha alterna a visibilidade.
3. Entrar com dados de demonstração abre a Home; cancelar logout mantém a sessão e confirmar volta ao login.
4. Recuperação rejeita e-mail inválido; código incorreto mostra erro; `123456` avança.
5. Senhas diferentes ou curtas impedem o avanço. Confirmar senhas válidas chega ao sucesso simulado.
6. Menu mobile abre/fecha, foco fica acessível e os links indicam a página ativa.
7. Selecionar outro dia atualiza os eventos; setas mudam a semana e o mês quando necessário.
8. Tecla Tab percorre os controles em ordem lógica, com foco visível; Escape fecha Drawer e modal.

## Diferenças ainda abertas

O README lista as artes que não puderam ser exportadas, o frame de nova senha que falta comparar e as páginas fora desta etapa. O gráfico inicial usa barras HTML/CSS com descrição textual dos valores; o módulo completo de BI ainda requer gráficos, dados, filtros e estados próprios.

## Commit sugerido após validação visual

`fix: align initial FIXA screens with Figma and restore brand assets`
