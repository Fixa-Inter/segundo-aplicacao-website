# Cadastro de técnicos — demonstração e integração futura

Regras informadas pelo responsável pelo projeto em **26/09/2026**. Ainda não existe contrato de API nem lista definitiva de campos obrigatórios.

## Regras implementadas

- Tipos de acesso do sistema: `GESTOR`, `TÉCNICO`, `SOLICITANTE` e `ADMINISTRADOR`.
- O cadastro realizado pelo gestor cria somente um `TÉCNICO`. O campo é somente para leitura, e o service impõe esse valor mesmo se receber propriedades adicionais em JavaScript.
- O endereço é copiado do perfil do gestor **ao salvar**. CEP, logradouro, bairro, cidade, estado, número e complemento não podem ser selecionados ou editados no cadastro de técnicos.
- Editar o perfil não altera automaticamente os técnicos existentes. Ao salvar novamente um técnico, o service aplica o endereço atual do gestor. Sincronização retroativa deverá ser definida no contrato da API.
- Senha provisória: de 8 a 128 caracteres, com maiúscula, minúscula e símbolo especial. O mínimo e a composição foram sugeridos pelo grupo; o limite de 128 é uma proteção do formulário demonstrativo. Ambos precisam ser conferidos com a API.
- A senha é usada apenas para validar o formulário de criação. **Não é enviada ao repositório em memória, não é armazenada e não cria uma credencial real.** A edição não pede senha.
- A data de nascimento é digitada em `DD/MM/AAAA`, convertida para ISO e validada contra datas impossíveis e futuras.
- Na demonstração, nome, nascimento, e-mail, telefone com DDD, especialidade e turno são obrigatórios. E-mails duplicados são rejeitados sem diferenciar maiúsculas e espaços externos.
- Especialidade, turno e situação aparecem em uma seção operacional separada. São necessários para a listagem demonstrativa atual; não constam no frame de cadastro do Figma e seus campos definitivos devem ser acordados com o backend.
- Técnicos vinculados a eventos não podem ser excluídos antes de reatribuir ou excluir esses eventos.

## Referência e evidências

Interface baseada no frame **5631:6389** da [cópia Website v2](https://www.figma.com/design/zgDd0qejEdOT2E16qQOsJs/Fixa--Copy-?node-id=5631-6389). As regras explícitas de acesso/endereço substituem os campos selecionáveis do protótipo.

- `src/components/TechnicianForm`: formulário, foco no primeiro erro, labels e textos de ajuda associados.
- `src/types/management.ts` e `src/types/auth.ts`: entidades e tipos de acesso.
- `src/services/managementService.ts`: imposição de tipo/endereço e descarte de propriedades indevidas.
- `src/utils/managementValidation.ts`: validações provisórias.
- `tests/managementService.test.mjs`: herança do endereço, acesso fixo, ausência de senha no armazenamento, cópias independentes e restrições do cadastro.
- `tests/validation.test.mjs`: composição de senha, datas, telefone e turno.

## Quando o contrato existir

Confirmar nomes, obrigatoriedade e formatos dos campos; política de senha; identificação/autorização do gestor; semântica de atualização do endereço; erros de duplicidade e vínculos. Substituir a implementação do service por chamadas documentadas e testar autorização **no servidor**. Nenhum endpoint foi antecipado no frontend.
