BEGIN;

CREATE TABLE usuario (
    cod_usuario  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome         VARCHAR(150) NOT NULL,
    login        VARCHAR(60)  NOT NULL,
    senha        VARCHAR(255) NOT NULL,
    ativo        BOOLEAN      NOT NULL DEFAULT TRUE,
    perfil       VARCHAR(20)  NOT NULL,
    CONSTRAINT uq_usuario_login UNIQUE (login),
    CONSTRAINT ck_usuario_perfil CHECK (perfil IN ('GESTOR', 'COLABORADOR'))
);

CREATE TABLE raca (
    cod_raca  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome      VARCHAR(100) NOT NULL
);

CREATE TABLE reprodutor (
    cod_reprodutor   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    numero_registro  VARCHAR(60),
    nome             VARCHAR(150) NOT NULL,
    cod_raca         INTEGER,
    CONSTRAINT uq_reprodutor_registro UNIQUE (numero_registro),
    CONSTRAINT fk_reprodutor_raca FOREIGN KEY (cod_raca) REFERENCES raca (cod_raca)
);

CREATE TABLE animal (
    cod_animal         INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    brinco             VARCHAR(30) NOT NULL,
    nome               VARCHAR(100) NOT NULL,
    sexo               CHAR(1)      NOT NULL,
    data_nascimento    DATE NOT NULL,
    situacao_rebanho   VARCHAR(30) NOT NULL,
    categoria          VARCHAR(30) NOT NULL,
    situacao_lactacao  VARCHAR(30) NOT NULL,
    data_saida         DATE,
    tipo_saida         VARCHAR(30),
    motivo_saida       VARCHAR(255),
    prenha             CHAR(1) NOT NULL,
    cod_raca           INTEGER,
    cod_animal_mae     INTEGER,
    cod_parto          INTEGER,
    CONSTRAINT uq_animal_brinco UNIQUE (brinco),
    CONSTRAINT ck_animal_brinco CHECK (btrim(brinco) <> ''),
    CONSTRAINT ck_animal_nome CHECK (btrim(nome) <> ''),
    CONSTRAINT ck_animal_categoria CHECK (btrim(categoria) <> ''),
    CONSTRAINT ck_animal_prenha CHECK (prenha IN ('S', 'N') AND (sexo = 'F' OR prenha = 'N')),
    CONSTRAINT ck_animal_situacao CHECK (situacao_rebanho IN ('ATIVA', 'INATIVA')),
    CONSTRAINT ck_animal_lactacao CHECK (situacao_lactacao IN ('EM_LACTACAO', 'SECA', 'NAO_SE_APLICA')
        AND (sexo = 'F' OR situacao_lactacao = 'NAO_SE_APLICA')),
    CONSTRAINT ck_animal_dados_saida CHECK (
        (situacao_rebanho = 'ATIVA' AND data_saida IS NULL AND tipo_saida IS NULL AND motivo_saida IS NULL)
        OR (situacao_rebanho = 'INATIVA' AND data_saida IS NOT NULL
            AND tipo_saida IS NOT NULL AND tipo_saida IN ('DESCARTE', 'OBITO')
            AND motivo_saida IS NOT NULL AND btrim(motivo_saida) <> '')),
    CONSTRAINT ck_animal_sexo CHECK (sexo IN ('F', 'M')),
    CONSTRAINT ck_animal_saida CHECK (data_saida IS NULL OR data_saida >= data_nascimento),
    CONSTRAINT ck_animal_nao_e_propria_mae CHECK (cod_animal_mae IS NULL OR cod_animal_mae <> cod_animal),
    CONSTRAINT fk_animal_raca FOREIGN KEY (cod_raca) REFERENCES raca (cod_raca),
    CONSTRAINT fk_animal_mae  FOREIGN KEY (cod_animal_mae) REFERENCES animal (cod_animal)
);

CREATE TABLE inseminacao (
    cod_inseminacao   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    data_inseminacao  DATE         NOT NULL,
    tipo_semen        VARCHAR(50),
    lote              VARCHAR(50),
    observacao        TEXT,
    cod_animal        INTEGER      NOT NULL,
    cod_reprodutor    INTEGER      NOT NULL,
    CONSTRAINT fk_inseminacao_animal     FOREIGN KEY (cod_animal)     REFERENCES animal (cod_animal),
    CONSTRAINT fk_inseminacao_reprodutor FOREIGN KEY (cod_reprodutor) REFERENCES reprodutor (cod_reprodutor)
);

CREATE TABLE gestacao (
    cod_gestacao           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    data_previsao_parto    DATE,
    data_prevista_secagem  DATE,
    situacao               VARCHAR(30) NOT NULL,
    data_encerramento      DATE,
    observacao             TEXT,
    cod_animal             INTEGER     NOT NULL,
    cod_inseminacao        INTEGER,
    CONSTRAINT uq_gestacao_inseminacao UNIQUE (cod_inseminacao),
    CONSTRAINT fk_gestacao_animal      FOREIGN KEY (cod_animal)      REFERENCES animal (cod_animal),
    CONSTRAINT fk_gestacao_inseminacao FOREIGN KEY (cod_inseminacao) REFERENCES inseminacao (cod_inseminacao)
);

CREATE TABLE parto (
    cod_parto       INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    data_parto      DATE    NOT NULL,
    observacao      TEXT,
    cod_animal_mae  INTEGER NOT NULL,
    cod_gestacao    INTEGER,
    CONSTRAINT uq_parto_gestacao UNIQUE (cod_gestacao),
    CONSTRAINT fk_parto_mae      FOREIGN KEY (cod_animal_mae) REFERENCES animal (cod_animal),
    CONSTRAINT fk_parto_gestacao FOREIGN KEY (cod_gestacao)   REFERENCES gestacao (cod_gestacao)
);

ALTER TABLE animal
    ADD CONSTRAINT fk_animal_parto FOREIGN KEY (cod_parto) REFERENCES parto (cod_parto);

CREATE TABLE secagem (
    cod_secagem   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    data_secagem  DATE    NOT NULL,
    observacao    TEXT,
    cod_animal    INTEGER NOT NULL,
    cod_gestacao  INTEGER,
    CONSTRAINT uq_secagem_gestacao UNIQUE (cod_gestacao),
    CONSTRAINT fk_secagem_animal   FOREIGN KEY (cod_animal)   REFERENCES animal (cod_animal),
    CONSTRAINT fk_secagem_gestacao FOREIGN KEY (cod_gestacao) REFERENCES gestacao (cod_gestacao)
);

CREATE TABLE diagnostico_gestacao (
    cod_diagnostico   INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    resultado         VARCHAR(30) NOT NULL,
    metodo            VARCHAR(50) NOT NULL,
    data_diagnostico  DATE        NOT NULL,
    observacao        TEXT,
    cod_animal        INTEGER     NOT NULL,
    cod_inseminacao   INTEGER,
    cod_gestacao      INTEGER,
    CONSTRAINT ck_diag_metodo CHECK (btrim(metodo) <> ''),
    CONSTRAINT ck_diag_resultado CHECK (resultado IN ('POSITIVO', 'NEGATIVO', 'INCONCLUSIVO')),
    CONSTRAINT fk_diag_animal      FOREIGN KEY (cod_animal)      REFERENCES animal (cod_animal),
    CONSTRAINT fk_diag_inseminacao FOREIGN KEY (cod_inseminacao) REFERENCES inseminacao (cod_inseminacao),
    CONSTRAINT fk_diag_gestacao    FOREIGN KEY (cod_gestacao)    REFERENCES gestacao (cod_gestacao)
);

CREATE TABLE atividade (
    cod_atividade           INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    titulo                  VARCHAR(150) NOT NULL,
    tipo                    VARCHAR(50) NOT NULL,
    descricao               TEXT,
    data_hora_prevista      TIMESTAMP,
    situacao                VARCHAR(30)  NOT NULL DEFAULT 'AGENDADA',
    data_hora_encerramento  TIMESTAMP,
    CONSTRAINT ck_atividade_textos CHECK (btrim(titulo) <> '' AND btrim(tipo) <> ''),
    CONSTRAINT ck_atividade_situacao CHECK (situacao IN ('AGENDADA', 'CONCLUIDA', 'CANCELADA')),
    CONSTRAINT ck_atividade_datas CHECK (
        (situacao = 'AGENDADA' AND data_hora_prevista IS NOT NULL AND data_hora_encerramento IS NULL)
        OR (situacao IN ('CONCLUIDA', 'CANCELADA') AND data_hora_encerramento IS NOT NULL))
);

CREATE TABLE atividade_animal (
    cod_atividade  INTEGER NOT NULL,
    cod_animal     INTEGER NOT NULL,
    PRIMARY KEY (cod_atividade, cod_animal),
    CONSTRAINT fk_aa_atividade FOREIGN KEY (cod_atividade) REFERENCES atividade (cod_atividade) ON DELETE CASCADE,
    CONSTRAINT fk_aa_animal    FOREIGN KEY (cod_animal)    REFERENCES animal (cod_animal)
);

CREATE TABLE medicamento (
    cod_medicamento  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome             VARCHAR(150) NOT NULL,
    descricao        TEXT
);

CREATE TABLE uso_medicamento (
    cod_uso              INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    data_hora_aplicacao  TIMESTAMP,
    dose                 VARCHAR(50),
    unidade_carencia     VARCHAR(20),
    valor_carencia       INTEGER,
    fim_carencia_leite   TIMESTAMP,
    observacao           TEXT,
    cod_animal           INTEGER       NOT NULL,
    cod_atividade        INTEGER       NOT NULL,
    cod_medicamento      INTEGER       NOT NULL,
    CONSTRAINT ck_uso_dose CHECK (dose IS NULL OR btrim(dose) <> ''),
    CONSTRAINT ck_uso_unidade CHECK (unidade_carencia IN ('HORAS', 'DIAS')),
    CONSTRAINT ck_uso_carencia CHECK (valor_carencia IS NULL OR valor_carencia >= 0),
    CONSTRAINT fk_uso_participacao FOREIGN KEY (cod_atividade, cod_animal)
        REFERENCES atividade_animal (cod_atividade, cod_animal) DEFERRABLE INITIALLY DEFERRED,
    CONSTRAINT fk_uso_animal      FOREIGN KEY (cod_animal)      REFERENCES animal (cod_animal),
    CONSTRAINT fk_uso_atividade   FOREIGN KEY (cod_atividade)   REFERENCES atividade (cod_atividade),
    CONSTRAINT fk_uso_medicamento FOREIGN KEY (cod_medicamento) REFERENCES medicamento (cod_medicamento)
);

CREATE TABLE fornecedor (
    cod_fornecedor  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome            VARCHAR(150) NOT NULL,
    contato         VARCHAR(150)
);

CREATE TABLE tipo_custo (
    cod_tipo_custo  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome            VARCHAR(100) NOT NULL
);

CREATE TABLE custo (
    cod_custo       INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    data_custo      DATE          NOT NULL,
    descricao       VARCHAR(255) NOT NULL,
    valor           NUMERIC(12,2) NOT NULL,
    cod_tipo_custo  INTEGER       NOT NULL,
    cod_fornecedor  INTEGER,
    CONSTRAINT ck_custo_valor CHECK (valor >= 0),
    CONSTRAINT fk_custo_tipo       FOREIGN KEY (cod_tipo_custo) REFERENCES tipo_custo (cod_tipo_custo),
    CONSTRAINT fk_custo_fornecedor FOREIGN KEY (cod_fornecedor) REFERENCES fornecedor (cod_fornecedor)
);

CREATE TABLE fechamento_mensal (
    cod_fechamento     INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    mes_referencia     SMALLINT      NOT NULL,
    ano_referencia     SMALLINT      NOT NULL,
    valor_total_leite  NUMERIC(14,2),
    observacao         TEXT,
    CONSTRAINT uq_fechamento_mes_ano UNIQUE (mes_referencia, ano_referencia),
    CONSTRAINT ck_fechamento_mes CHECK (mes_referencia BETWEEN 1 AND 12),
    CONSTRAINT ck_fechamento_ano CHECK (ano_referencia > 0),
    CONSTRAINT ck_fechamento_valor CHECK (valor_total_leite >= 0)
);

CREATE TABLE coleta_leite (
    cod_coleta          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    data_coleta         DATE          NOT NULL,
    volume_litros       NUMERIC(10,2) NOT NULL,
    horario_coleta      TIME,
    observacao          TEXT,
    resultado_alizarol  VARCHAR(30),
    cod_fechamento      INTEGER,
    CONSTRAINT ck_coleta_volume CHECK (volume_litros >= 0),
    CONSTRAINT fk_coleta_fechamento FOREIGN KEY (cod_fechamento) REFERENCES fechamento_mensal (cod_fechamento)
);

CREATE TABLE tipo_receita (
    cod_tipo_receita INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome            VARCHAR(100) NOT NULL
);

CREATE TABLE receita (
    cod_receita     INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    data_receita    DATE          NOT NULL,
    descricao       VARCHAR(255) NOT NULL,
    cod_tipo_receita INTEGER NOT NULL,
    valor           NUMERIC(12,2) NOT NULL,
    cod_fechamento  INTEGER,
    CONSTRAINT uq_receita_fechamento UNIQUE (cod_fechamento),
    CONSTRAINT ck_receita_valor CHECK (valor >= 0),
    CONSTRAINT fk_receita_tipo FOREIGN KEY (cod_tipo_receita) REFERENCES tipo_receita (cod_tipo_receita),
    CONSTRAINT fk_receita_fechamento FOREIGN KEY (cod_fechamento) REFERENCES fechamento_mensal (cod_fechamento)
);

CREATE TABLE documento (
    cod_documento       INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tipo_documento      VARCHAR(50),
    nome_arquivo        VARCHAR(255) NOT NULL,
    referencia_arquivo  VARCHAR(500) NOT NULL,
    data_hora_inclusao  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    descricao           VARCHAR(255),
    cod_fechamento      INTEGER,
    CONSTRAINT fk_documento_fechamento FOREIGN KEY (cod_fechamento) REFERENCES fechamento_mensal (cod_fechamento)
);

CREATE TABLE documento_custo (
    cod_documento  INTEGER NOT NULL,
    cod_custo      INTEGER NOT NULL,
    PRIMARY KEY (cod_documento, cod_custo),
    CONSTRAINT fk_dc_documento FOREIGN KEY (cod_documento) REFERENCES documento (cod_documento) ON DELETE CASCADE,
    CONSTRAINT fk_dc_custo     FOREIGN KEY (cod_custo)     REFERENCES custo (cod_custo)
);

CREATE TABLE documento_receita (
    cod_documento  INTEGER NOT NULL,
    cod_receita    INTEGER NOT NULL,
    PRIMARY KEY (cod_documento, cod_receita),
    CONSTRAINT fk_dr_documento FOREIGN KEY (cod_documento) REFERENCES documento (cod_documento) ON DELETE CASCADE,
    CONSTRAINT fk_dr_receita   FOREIGN KEY (cod_receita)   REFERENCES receita (cod_receita)
);

COMMIT;
