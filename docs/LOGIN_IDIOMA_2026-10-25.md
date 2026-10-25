# Idioma e acesso local — 25/10/2026

Correção complementar da [Issue #10](https://github.com/Fixa-Inter/segundo-aplicacao-website/issues/10), na branch `feature/integracao-api-web`, conforme o esclarecimento do usuário sobre idioma automático e escolha manual.

## Causa e regra final

O código anterior não consultava o idioma do navegador: restaurava `fixa.preferences.language` e usava português na ausência desse valor. Portanto, uma preferência salva em chinês podia explicar a captura mesmo com o navegador em português.

- Sem escolha manual, consulta `navigator.languages` em ordem de preferência e usa o primeiro idioma suportado. Alternativa: português.
- A escolha explícita nas Configurações fica salva neste navegador e prevalece sobre a detecção automática. “Idioma do navegador” restaura o modo automático.
- Uma mudança de idiomas do navegador atualiza o modo automático via `languagechange`; não sobrescreve uma escolha manual.
- Não foi mantido seletor adicional na tela de login, conforme solicitado pelo usuário.
- Preferências antigas diferentes do antigo padrão português são preservadas como manuais. O antigo padrão português passa ao modo navegador, preservando o tema. O formato antigo não permite distinguir português padrão de uma escolha manual em português; essa escolha pode ser reafirmada nas Configurações.

## Outros ajustes relacionados à captura

O preenchimento mostrado no CNPJ é compatível com o gerenciador de credenciais. O e-mail agora tem `autocomplete="username"`, a senha `current-password`, e o CNPJ tem nome distinto e autocomplete desabilitado. As credenciais salvas do perfil pessoal do usuário não foram acessadas. O teste isolado verifica a identificação dos campos; não garante como cada extensão ou credencial antiga será preenchida.

A porta 5173 estava ocupada pela instância deixada para teste, e outro Vite iniciou em 5174. A configuração agora fixa 5173 com `strictPort`: uma segunda execução informa a porta ocupada. A instância de teste é encerrada ao final; o usuário deve reiniciar seu terminal com `npm run dev` e abrir 5173 para usar a origem permitida pela API.

## Validação

- Suíte da web: 60 testes aprovados, incluindo prioridade de idiomas, variantes regionais, escolha manual antiga, cache automático e valores inválidos.
- Formatação, lint e build aprovados.
- Edge isolado com idiomas reais dos contextos pt-BR, en-US, es-AR e zh-CN; sem interceptação HTTP.
- Cache automático em chinês recalculado como português no navegador pt-BR. Escolha manual nas Configurações persiste ao recarregar e não é alterada por `languagechange`; retornar ao modo navegador funciona.
- Sem seletor no login ou transbordamento horizontal em 320 e 390 px. Login real na API local retorna 200, sem erro de JavaScript nos cenários percorridos.
- Uma segunda execução de `npm run dev` com 5173 ocupada encerra com a mensagem correspondente, em vez de escolher 5174.

Evidências: [desktop](evidencias/login-idioma-2026-10-25/login-portugues-desktop.png) e [celular](evidencias/login-idioma-2026-10-25/login-portugues-mobile.png).

Referências: [idiomas do navegador](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/languages), [autocomplete](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/autocomplete) e [porta do Vite](https://vite.dev/config/server-options#server-strictport).
