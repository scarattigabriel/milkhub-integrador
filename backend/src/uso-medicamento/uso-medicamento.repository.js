const { Op } = require("sequelize");
const { UsoMedicamento, Medicamento, Animal, Atividade, AtividadeAnimal } = require("../database/models");

// Definir os relacionamentos carregados nas consultas
function relacoes() {
    return [
        { model: Medicamento, as: "medicamento" },
        { model: Animal, as: "animal" },
        { model: Atividade, as: "atividade" },
    ];
}

// Consultar os registros no banco
function listar(filtros) {
    return UsoMedicamento.findAll({ where: filtros, include: relacoes(), order: [["codUso", "DESC"]] });
}

// Buscar o registro pelo código
function buscarPorCod(codUso, transacao) {
    return UsoMedicamento.findByPk(codUso, { transaction: transacao });
}

// Buscar o registro com seus relacionamentos
function buscarDetalhes(codUso) {
    return UsoMedicamento.findByPk(codUso, { include: relacoes() });
}

// Listar os usos de medicamento vinculados à atividade
function listarDaAtividade(codAtividade, transacao) {
    return UsoMedicamento.findAll({ where: { codAtividade }, transaction: transacao, order: [["codUso", "ASC"]] });
}

// Buscar o medicamento informado para o uso
function buscarMedicamento(codMedicamento, transacao) {
    return Medicamento.findByPk(codMedicamento, { transaction: transacao });
}

// Conferir a participação do animal na atividade
function buscarParticipacao(codAtividade, codAnimal, transacao) {
    return AtividadeAnimal.findOne({ where: { codAtividade, codAnimal }, transaction: transacao });
}

// Inserir o registro no banco
function criar(dados, transacao) {
    return UsoMedicamento.create(dados, { transaction: transacao });
}

// Atualizar o registro no banco
function atualizar(uso, dados, transacao) {
    return uso.update(dados, { transaction: transacao });
}

// Excluir o registro do banco
function deletar(uso, transacao) {
    return uso.destroy({ transaction: transacao });
}

// Consultar as aplicações com carência de leite ainda vigente
function listarCarencias(agora, codAnimal, transacao) {
    return UsoMedicamento.findAll({
        transaction: transacao,
        where: {
            ...(codAnimal ? { codAnimal } : {}),
            dataHoraAplicacao: { [Op.lte]: agora },
            fimCarenciaLeite: { [Op.gt]: agora },
        },
        include: [
            { model: Atividade, as: "atividade", required: true, where: { situacao: "CONCLUIDA" } },
            { model: Animal, as: "animal", required: true, where: { situacaoRebanho: "ATIVA" } },
            { model: Medicamento, as: "medicamento" },
        ],
        order: [["fimCarenciaLeite", "DESC"], ["codUso", "ASC"]],
    });
}

module.exports = {
    listar, buscarPorCod, buscarDetalhes, listarDaAtividade, buscarMedicamento,
    buscarParticipacao, criar, atualizar, deletar, listarCarencias,
};
