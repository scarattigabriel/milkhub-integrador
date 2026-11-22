const { ForeignKeyConstraintError, ValidationError } = require("sequelize");
const repository = require("./uso-medicamento.repository");
const atividadeRepository = require("../atividade/atividade.repository");
const { criarErro, objeto, codigo, texto, dataHora, diaLocal } = require("../utils/validacao");
const { tipoSanitario } = require("../config/tipos-atividade");

const CAMPOS = ["codAnimal", "codMedicamento", "dose", "unidadeCarencia", "valorCarencia", "observacao"];

// Conferir e normalizar os campos enviados para a operação
function validarDados(dados, parcial = false) {
    objeto(dados, parcial ? CAMPOS.filter(campo => campo !== "codAnimal") : CAMPOS);
    if (!Object.keys(dados).length) throw criarErro(400, "Informe os dados do uso de medicamento.");
    const valores = { ...dados };
    for (const campo of ["codAnimal", "codMedicamento"]) {
        if (!parcial || Object.hasOwn(valores, campo)) valores[campo] = codigo(valores[campo], campo);
    }
    for (const [campo, limite] of [["dose", 50], ["observacao", null]]) {
        if (Object.hasOwn(valores, campo)) valores[campo] = texto(valores[campo], campo, limite, true);
        else if (!parcial) valores[campo] = null;
    }
    if (Object.hasOwn(valores, "unidadeCarencia")) {
        if (valores.unidadeCarencia !== null && !["HORAS", "DIAS"].includes(valores.unidadeCarencia)) {
            throw criarErro(400, "unidadeCarencia deve ser HORAS ou DIAS.");
        }
    } else if (!parcial) valores.unidadeCarencia = null;
    if (Object.hasOwn(valores, "valorCarencia")) {
        if (valores.valorCarencia !== null && (!Number.isInteger(valores.valorCarencia)
            || valores.valorCarencia < 0 || valores.valorCarencia > 2147483647)) {
            throw criarErro(400, "valorCarencia deve ser um inteiro não negativo.");
        }
    } else if (!parcial) valores.valorCarencia = null;
    return valores;
}

// Exigir unidade e valor da carência informados em conjunto
function validarParCarencia(uso) {
    if ((uso.unidadeCarencia == null) !== (uso.valorCarencia == null)) {
        throw criarErro(400, "Informe unidade e valor de carência juntos, ou ambos como null.");
    }
}

// Conferir se a data do evento é compatível com a vida do animal
function validarDataDoAnimal(animal, data, encerrada = false) {
    const dia = diaLocal(data);
    if (dia < animal.dataNascimento || (animal.dataSaida && dia > animal.dataSaida)) {
        throw criarErro(400, "A data deve estar entre o nascimento e a saída do animal.");
    }
    if (!encerrada && animal.situacaoRebanho !== "ATIVA") {
        throw criarErro(400, "Somente animais ativos podem receber novos agendamentos.");
    }
}

// Conferir se os registros vinculados à operação existem
async function validarReferencias(uso, atividade, transacao) {
    if (!await repository.buscarMedicamento(uso.codMedicamento, transacao)) {
        throw criarErro(400, "O medicamento informado não existe.");
    }
    if (!await repository.buscarParticipacao(atividade.codAtividade, uso.codAnimal, transacao)) {
        throw criarErro(400, "O animal deve participar da atividade antes de receber um medicamento.");
    }
    const animal = await atividadeRepository.buscarAnimal(uso.codAnimal, transacao);
    if (!animal) throw criarErro(400, "O animal informado não existe.");
    validarDataDoAnimal(animal, atividade.dataHoraPrevista);
}

// Impedir alterações em atividades concluídas ou canceladas
function exigirAgendada(atividade) {
    if (!atividade) throw criarErro(404, "Atividade não encontrada.");
    if (atividade.situacao !== "AGENDADA") {
        throw criarErro(409, "Somente atividades agendadas podem ser alteradas, concluídas ou canceladas.");
    }
}

// Converter falhas conhecidas em erros adequados para a operação
function tratarErro(erro) {
    if (erro instanceof ForeignKeyConstraintError) return criarErro(400, "Animal, atividade ou medicamento inexistente ou alterado.");
    if (erro instanceof ValidationError) return criarErro(400, "Os dados informados são inválidos.");
    if (["40001", "40P01"].includes(erro.original?.code)) {
        return criarErro(409, "Houve uma alteração simultânea. Consulte os dados e tente novamente.");
    }
    return erro;
}

// Validar e criar um uso de medicamento dentro da transação atual
async function criarNaTransacao(dados, atividade, transacao) {
    exigirAgendada(atividade);
    const valores = validarDados(dados);
    validarParCarencia(valores);
    await validarReferencias(valores, atividade, transacao);
    return repository.criar({ ...valores, codAtividade: atividade.codAtividade,
        dataHoraAplicacao: null, fimCarenciaLeite: null }, transacao);
}

// Validar os dados e cadastrar o registro
async function criar(dados) {
    objeto(dados, [...CAMPOS, "codAtividade"]);
    const { codAtividade, ...valores } = dados;
    const codigoAtividade = codigo(codAtividade, "codAtividade");
    try {
        return await atividadeRepository.executarEmTransacao(async transacao => {
            const atividade = await atividadeRepository.buscarPorCod(codigoAtividade, transacao);
            return criarNaTransacao(valores, atividade, transacao);
        });
    } catch (erro) { throw tratarErro(erro); }
}

// Atualizar ou remover um uso planejado em uma transação
async function alterar(codUso, dados, excluir = false) {
    const id = codigo(codUso, "codUso");
    const valores = excluir ? null : validarDados(dados, true);
    try {
        return await atividadeRepository.executarEmTransacao(async transacao => {
            const uso = await repository.buscarPorCod(id, transacao);
            if (!uso) throw criarErro(404, "Uso de medicamento não encontrado.");

            const atividade = await atividadeRepository.buscarPorCod(uso.codAtividade, transacao);
            exigirAgendada(atividade);
            if (excluir) return repository.deletar(uso, transacao);
            const completo = { ...uso.get({ plain: true }), ...valores };
            validarParCarencia(completo);
            await validarReferencias(completo, atividade, transacao);
            return repository.atualizar(uso, valores, transacao);
        });
    } catch (erro) { throw tratarErro(erro); }
}

// Validar as aplicações, calcula as carências e gravar os resultados
async function concluirDaAtividade(atividade, ajustes, encerramento, transacao) {
    if (!Array.isArray(ajustes)) throw criarErro(400, "usosMedicamento deve ser uma lista de ajustes por codUso.");
    const usos = await repository.listarDaAtividade(atividade.codAtividade, transacao);
    if (tipoSanitario(atividade.tipo)) {
        const participantes = await atividadeRepository.listarParticipacoes(atividade.codAtividade, transacao);
        if (!participantes.length || participantes.some(item => !usos.some(uso => uso.codAnimal === item.codAnimal))) {
            throw criarErro(400, "A atividade sanitária deve ter ao menos um medicamento para cada animal participante.");
        }
    }
    const alteracoes = new Map();
    for (const ajuste of ajustes) {
        objeto(ajuste, ["codUso", "dataHoraAplicacao", "dose", "unidadeCarencia", "valorCarencia", "observacao"]);
        const id = codigo(ajuste.codUso, "codUso");
        if (alteracoes.has(id) || !usos.some(uso => uso.codUso === id)) {
            throw criarErro(400, "Informe cada codUso uma única vez e pertencente à atividade.");
        }
        alteracoes.set(id, ajuste);
    }
    // Validar todos antes de gravar; a transação também desfaz qualquer falha posterior
    const aplicacoes = [];
    for (const uso of usos) {
        const { codUso, dataHoraAplicacao, ...dados } = alteracoes.get(uso.codUso) || {};
        const valores = Object.keys(dados).length ? validarDados(dados, true) : {};
        const completo = { ...uso.get({ plain: true }), ...valores };
        validarParCarencia(completo);
        if (!completo.dose || completo.unidadeCarencia == null || completo.valorCarencia == null) {
            throw criarErro(400, `Informe dose, unidade e valor de carência para concluir o uso ${uso.codUso}.`);
        }
        const aplicacao = dataHoraAplicacao === undefined ? encerramento : dataHora(dataHoraAplicacao, "dataHoraAplicacao", true);
        if (aplicacao > encerramento) throw criarErro(400, "A aplicação não pode ocorrer após o encerramento da atividade.");
        const animal = await atividadeRepository.buscarAnimal(uso.codAnimal, transacao);
        if (!animal) throw criarErro(400, "Animal não encontrado.");
        validarDataDoAnimal(animal, aplicacao, true);
        const fator = completo.unidadeCarencia === "DIAS" ? 86400000 : 3600000;
        const fim = new Date(aplicacao.getTime() + completo.valorCarencia * fator);
        if (!Number.isFinite(fim.getTime()) || fim.getUTCFullYear() > 9999) {
            throw criarErro(400, "O período de carência excede o intervalo de datas suportado.");
        }
        aplicacoes.push([uso, { ...valores, dataHoraAplicacao: aplicacao, fimCarenciaLeite: fim }]);
    }
    for (const [uso, valores] of aplicacoes) await repository.atualizar(uso, valores, transacao);
}

// Listar os registros com os filtros validados
async function listar(filtros = {}) {
    objeto(filtros, ["codAnimal", "codAtividade", "codMedicamento"]);
    const valores = {};
    for (const [campo, valor] of Object.entries(filtros)) valores[campo] = codigo(valor, campo);
    return repository.listar(valores);
}

// Buscar o registro pelo código e conferir se ele existe
async function buscarPorCod(codUso) {
    const uso = await repository.buscarDetalhes(codigo(codUso, "codUso"));
    if (!uso) throw criarErro(404, "Uso de medicamento não encontrado.");
    return uso;
}

// Consultar as aplicações com carência de leite ainda vigente
async function listarCarencias(filtros = {}) {
    objeto(filtros, ["codAnimal"]);
    const codAnimal = Object.hasOwn(filtros, "codAnimal") ? codigo(filtros.codAnimal, "codAnimal") : undefined;
    const usos = await repository.listarCarencias(new Date(), codAnimal);
    return agruparCarencias(usos);
}

// Agrupar as aplicações por animal e manter o maior prazo de carência
function agruparCarencias(usos) {
    const animais = new Map();
    for (const uso of usos) {
        let grupo = animais.get(uso.codAnimal);
        if (!grupo) {
            grupo = { animal: uso.animal, fimCarenciaLeite: uso.fimCarenciaLeite, usosMedicamento: [] };
            animais.set(uso.codAnimal, grupo);
        }
        if (new Date(uso.fimCarenciaLeite) > new Date(grupo.fimCarenciaLeite)) grupo.fimCarenciaLeite = uso.fimCarenciaLeite;
        grupo.usosMedicamento.push(uso);
    }
    return [...animais.values()];
}

module.exports = {
    listar, buscarPorCod, criar,
    // Validar as alterações e atualizar o registro
    atualizar: (id, dados) => alterar(id, dados),
    // Excluir o registro respeitando os vínculos existentes
    deletar: id => alterar(id, null, true),
    listarCarencias, agruparCarencias, criarNaTransacao, concluirDaAtividade, validarDataDoAnimal, exigirAgendada, tratarErro,
};
