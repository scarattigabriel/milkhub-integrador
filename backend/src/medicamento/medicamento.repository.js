const { Op } = require("sequelize");
const { Medicamento } = require("../database/models");

// Consultar os registros no banco
async function listar(filtros = {}) {
    const where = {};
    if (filtros.busca) {
        const texto = filtros.busca.replace(/[\\%_]/g, "\\$&");
        where.nome = { [Op.iLike]: `%${texto}%` };
    }
    return Medicamento.findAll({ where, order: [["nome", "ASC"], ["codMedicamento", "ASC"]] });
}

// Buscar o registro pelo código
async function buscarPorCod(codMedicamento) {
    return Medicamento.findByPk(codMedicamento);
}

// Inserir o registro no banco
async function criar(dados) {
    return Medicamento.create(dados);
}

// Atualizar o registro no banco
async function atualizar(codMedicamento, dados) {
    const medicamento = await Medicamento.findByPk(codMedicamento);
    if (!medicamento) return null;
    return medicamento.update(dados);
}

// Excluir o registro do banco
async function deletar(codMedicamento) {
    const medicamento = await Medicamento.findByPk(codMedicamento);
    if (!medicamento) return null;
    await medicamento.destroy();
    return medicamento;
}

module.exports = { listar, buscarPorCod, criar, atualizar, deletar };
