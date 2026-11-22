const { Op, Transaction } = require("sequelize");
const { sequelize, Atividade, AtividadeAnimal, Animal, UsoMedicamento, Medicamento } = require("../database/models");

// Executar as alterações em conjunto e desfazer tudo se houver uma falha
function executarEmTransacao(operacao) {
    return sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE }, operacao);
}

// Definir os relacionamentos carregados nas consultas
function relacoes() {
    return [
        { model: AtividadeAnimal, as: "participacoes", include: [{ model: Animal, as: "animal" }] },
        { model: UsoMedicamento, as: "usosMedicamento", include: [{ model: Medicamento, as: "medicamento" }] },
    ];
}

// Consultar os registros no banco
async function listar(filtros) {
    const { de, ate, codAnimal, pendentes, ...where } = filtros;
    if (de || ate || pendentes) {
        where.dataHoraPrevista = {};
        if (de) where.dataHoraPrevista[Op.gte] = de;
        if (ate) where.dataHoraPrevista[Op.lte] = ate;
        if (pendentes) {
            where.situacao = "AGENDADA";
            where.dataHoraPrevista[Op.lt] = new Date();
        }
    }
    if (codAnimal) {
        const participacoes = await AtividadeAnimal.findAll({ where: { codAnimal }, attributes: ["codAtividade"] });
        where.codAtividade = { [Op.in]: participacoes.map(item => item.codAtividade) };
    }
    return Atividade.findAll({ where, include: relacoes(), order: [["dataHoraPrevista", "ASC"], ["codAtividade", "ASC"]] });
}

// Buscar o registro pelo código
function buscarPorCod(codAtividade, transacao) {
    return Atividade.findByPk(codAtividade, { transaction: transacao, lock: transacao ? transacao.LOCK.UPDATE : undefined });
}

// Buscar o registro com seus relacionamentos
function buscarDetalhes(codAtividade, transacao) {
    return Atividade.findByPk(codAtividade, { transaction: transacao, include: relacoes() });
}

// Buscar o animal usado na operação
function buscarAnimal(codAnimal, transacao) {
    return Animal.findByPk(codAnimal, { transaction: transacao, lock: transacao.LOCK.UPDATE });
}

// Listar os animais participantes da atividade
function listarParticipacoes(codAtividade, transacao) {
    return AtividadeAnimal.findAll({ where: { codAtividade }, transaction: transacao });
}

// Substituir os vínculos dos animais participantes da atividade
async function substituirParticipacoes(codAtividade, animais, transacao) {
    await AtividadeAnimal.destroy({ where: { codAtividade }, transaction: transacao });
    return AtividadeAnimal.bulkCreate(animais.map(codAnimal => ({ codAtividade, codAnimal })), { transaction: transacao });
}

// Inserir o registro no banco
function criar(dados, transacao) {
    return Atividade.create(dados, { transaction: transacao });
}

// Atualizar o registro no banco
function atualizar(atividade, dados, transacao) {
    return atividade.update(dados, { transaction: transacao });
}

module.exports = {
    executarEmTransacao, listar, buscarPorCod, buscarDetalhes, buscarAnimal,
    listarParticipacoes, substituirParticipacoes, criar, atualizar,
};
