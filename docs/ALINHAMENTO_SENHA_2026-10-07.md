# Alinhamento das telas de senha — 07/10/2026

Revisão do feedback e das cinco capturas enviadas pelo usuário: e-mail, código, nova senha, troca autenticada e sucesso.

## Alterações

- Todas as etapas usam o mesmo layout, centralizado por fluxo normal de CSS. Foram removidos os deslocamentos verticais, margens negativas e escalas específicos de cada etapa.
- A coluna tem largura máxima de 480 px; campos e botão compartilham as mesmas bordas. A largura se adapta ao celular, sem depender da altura da janela.
- Ilustração, título e descrição formam um cabeçalho comum. A caixa da ilustração mede 220 px em desktop e 180 px em telas pequenas ou baixas, em todas as etapas. As cinco artes originais foram preservadas.
- Campos e botões têm altura mínima de 52 px. Rótulos, espaços entre campos e links secundários seguem as mesmas regras. O código tem seis células iguais com intervalos de 12 px, reduzidos a 8 px no celular.
- A margem externa diminui em notebooks baixos para a troca de senha caber inteira. Quando o conteúdo exceder a altura disponível, a página permite rolagem normal.
- Cores seguem as variáveis de tema, inclusive nos campos de código. Mantidos os rótulos acessíveis, foco do título ao avançar, validação e controles de mostrar senha.

## Verificação no navegador

| Cenário                                   | Resultado observado                                                                                                                                       |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E-mail, código e nova senha, 1280 × 720   | Página sem rolagem vertical; coluna de 480 px centralizada em x = 640 px. Campos e botão de 52 px.                                                        |
| Código, 1280 × 720                        | Seis campos de 70 × 64 px e intervalos iguais de 12 px.                                                                                                   |
| Troca autenticada, 1280 × 720             | Página de 720 px, conteúdo de 593,9 px, margens superior e inferior de aproximadamente 63 px. Ilustração, título, campos e botão centrados em x = 640 px. |
| Troca autenticada e sucesso, 1920 × 916   | Coluna de 480 px centrada em x = 960 px. Ilustrações de 220 px; conteúdo centralizado verticalmente.                                                      |
| Nova senha e troca autenticada, 390 × 844 | Campos e botão de aproximadamente 350 px, com margens laterais de 20 px. Sem transbordamento horizontal ou rolagem vertical nesses estados.               |
| Recuperação demonstrativa completa        | E-mail fictício → código demonstrativo 123456 → nova senha fictícia → sucesso com retorno ao login.                                                       |
| Troca demonstrativa pelo perfil           | Login fictício → Perfil → Alterar senha → sucesso com retorno ao perfil.                                                                                  |

Console sem avisos ou erros na sessão. Nenhuma credencial real foi alterada; os services continuam demonstrativos. A checagem visual foi feita em português e tema claro, sem representar validação de todos os idiomas ou dispositivos físicos.

Build TypeScript/Vite, lint, verificação de formatação e os 32 testes existentes passaram. Não foram acrescentados testes que repetem regras de estilo.

## Capturas

- [E-mail em notebook](evidencias/design-2026-10-07/senha-email-1280x720.png)
- [Código em notebook](evidencias/design-2026-10-07/senha-codigo-1280x720.png)
- [Nova senha em notebook](evidencias/design-2026-10-07/senha-nova-1280x720.png)
- [Nova senha no celular](evidencias/design-2026-10-07/senha-nova-390x844.png)
- [Troca de senha em notebook](evidencias/design-2026-10-07/senha-troca-1280x720.png)
- [Troca de senha em desktop](evidencias/design-2026-10-07/senha-troca-1920x916.png)
- [Troca de senha no celular](evidencias/design-2026-10-07/senha-troca-390x844.png)
- [Sucesso em desktop](evidencias/design-2026-10-07/senha-sucesso-1920x916.png)
