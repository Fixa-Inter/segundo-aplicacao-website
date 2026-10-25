-- Bootstrap idempotente somente do banco isolado fixa-web-local.
-- Nenhum cadastro já existente tem senha ou dados sobrescritos.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
INSERT INTO instituicao (nome,tipo_instituicao,dominio_email,data_criacao,esta_ativo)
VALUES ('FIXA Local',3,'fixa.test',CURRENT_TIMESTAMP,true)
ON CONFLICT (dominio_email) DO NOTHING;
INSERT INTO unidade (instituicao_id,nome,logradouro,numero,complemento,bairro,cidade,estado,cep,cnpj,data_criacao,esta_ativo)
SELECT id,'Unidade Local','Rua de Teste','100','','Centro','São Paulo','SP','01000000','12345678000195',CURRENT_TIMESTAMP,true
FROM instituicao WHERE dominio_email='fixa.test'
ON CONFLICT (cnpj) DO NOTHING;
INSERT INTO usuario (unidade_id,nome_completo,email,tipo_acesso,cargo,senha_hash,data_nascimento,data_criacao,esta_ativo,primeiro_acesso)
SELECT id,'Gestor Local','gestor@fixa.test',2,'Gestor de manutenção',crypt('__FIXA_PASSWORD__',gen_salt('bf',12)),'1990-01-01',CURRENT_TIMESTAMP,true,false
FROM unidade WHERE cnpj='12345678000195'
ON CONFLICT (email) DO NOTHING;
INSERT INTO turno (unidade_id,nome,hora_inicio,hora_fim,atravessa_meia_noite,data_criacao,esta_ativo)
SELECT id,'Diurno',8,16,false,CURRENT_TIMESTAMP,true FROM unidade u
WHERE cnpj='12345678000195' AND NOT EXISTS (SELECT 1 FROM turno t WHERE t.unidade_id=u.id AND t.nome='Diurno');
INSERT INTO local_unidade (unidade_id,nome,tipo_local_unidade,descricao,data_criacao,esta_ativo)
SELECT id,'Auditório',4,'Auditório da unidade local',CURRENT_TIMESTAMP,true FROM unidade u
WHERE cnpj='12345678000195' AND NOT EXISTS (SELECT 1 FROM local_unidade l WHERE l.unidade_id=u.id AND l.nome='Auditório');
