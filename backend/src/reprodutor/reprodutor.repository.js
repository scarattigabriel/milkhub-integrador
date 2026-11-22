const { Op } = require("sequelize");
const { Reprodutor, Raca } = require("../database/models");

// Consultar os registros no banco
async function listar({ busca, codRaca } = {}) {
    const where = codRaca ? { codRaca } : {};
    if (busca) {
        const termo = `%${busca.replace(/[\\%_]/g, "\\$&")}%`;
        where[Op.or] = [{ nome: { [Op.iLike]: termo } }, { numeroRegistro: { [Op.iLike]: termo } }];
    }
    return Reprodutor.findAll({ where, include: [{ model: Raca, as: "raca" }], order: [["nome", "ASC"], ["codReprodutor", "ASC"]] });
}

// Buscar o registro pelo código
function buscarPorCod(codReprodutor) {
    return Reprodutor.findByPk(codReprodutor, { include: [{ model: Raca, as: "raca" }] });
}

// Buscar a raça vinculada ao cadastro
function buscarRaca(codRaca) { return Raca.findByPk(codRaca); }
// Inserir o registro no banco
function criar(dados) { return Reprodutor.create(dados); }

// Atualizar o registro no banco
async function atualizar(id, dados) {
    const reprodutor = await Reprodutor.findByPk(id);
    return reprodutor ? reprodutor.update(dados) : null;
}

// Excluir o registro do banco
async function deletar(id) {
    const reprodutor = await Reprodutor.findByPk(id);
    if (!reprodutor) return null;
    await reprodutor.destroy();
    return reprodutor;
}

module.exports = { listar, buscarPorCod, buscarRaca, criar, atualizar, deletar };
