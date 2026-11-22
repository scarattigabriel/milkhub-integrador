const { Raca } = require("../database/models");

// Consultar os registros no banco
async function listar() {
    return Raca.findAll({ order: [["nome", "ASC"], ["codRaca", "ASC"]] });
}

// Buscar o registro pelo código
async function buscarPorCod(codRaca) {
    return Raca.findByPk(codRaca);
}

// Inserir o registro no banco
async function criar(dados) {
    return Raca.create(dados);
}

// Atualizar o registro no banco
async function atualizar(codRaca, dados) {
    const raca = await Raca.findByPk(codRaca);
    if (!raca) return null;
    return raca.update(dados);
}

// Excluir o registro do banco
async function deletar(codRaca) {
    const raca = await Raca.findByPk(codRaca);
    if (!raca) return null;
    await raca.destroy();
    return raca;
}

module.exports = { listar, buscarPorCod, criar, atualizar, deletar };
