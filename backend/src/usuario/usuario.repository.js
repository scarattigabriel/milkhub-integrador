const { Op, Transaction } = require("sequelize");
const { Usuario, sequelize } = require("../database/models");

// Executar as alterações em conjunto e desfazer tudo se houver uma falha
function executarEmTransacao(operacao) {
    return sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE }, operacao);
}

// Bloquear os gestores ativos para proteger alterações simultâneas
function bloquearGestoresAtivos(transacao) {
    return Usuario.findAll({ where: { perfil: "GESTOR", ativo: true }, attributes: ["codUsuario"],
        order: [["codUsuario", "ASC"]], transaction: transacao, lock: transacao.LOCK.UPDATE });
}

// Consultar os registros no banco
function listar({ busca, perfil, ativo, pagina, limite }) {
    const where = { ...(perfil ? { perfil } : {}), ...(ativo === undefined ? {} : { ativo }) };
    if (busca) {
        const termo = `%${busca.replace(/[\\%_]/g, "\\$&")}%`;
        where[Op.or] = [{ nome: { [Op.iLike]: termo } }, { login: { [Op.iLike]: termo } }];
    }
    return Usuario.findAndCountAll({ where, attributes: ["codUsuario", "nome", "login", "ativo", "perfil"],
        order: [["codUsuario", "ASC"]], limit: limite, offset: (pagina - 1) * limite });
}

// Buscar o usuário pelo login
async function buscarPorLogin(login, transacao) {
    return Usuario.findOne({
        where: {login}, transaction: transacao,
    });
}

// Buscar o registro pelo código
async function buscarPorCod(codUsuario, transacao){
    return Usuario.findByPk(codUsuario, { transaction: transacao, lock: transacao ? transacao.LOCK.UPDATE : undefined });
}

// Buscar um gestor ativo para conferir o cadastro inicial
async function buscarGestorAtivo() {
    return Usuario.findOne({
        where: { perfil: "GESTOR", ativo: true },
        attributes: ["codUsuario"],
    });
}

// Inserir o registro no banco
async function criar(dados) {
    return Usuario.create(dados);
}

// Atualizar o registro no banco
async function atualizar(codUsuario, dados, transacao) {
    const usuario = await Usuario.findByPk(codUsuario, { transaction: transacao });
    if (!usuario) return null;
    return usuario.update(dados, { transaction: transacao });
}

// Excluir o registro do banco
async function deletar(codUsuario, transacao) {
    const usuario = await Usuario.findByPk(codUsuario, { transaction: transacao });
    if (!usuario) return null;
    await usuario.destroy({ transaction: transacao });
    return usuario;
}

module.exports = {
    listar, executarEmTransacao, bloquearGestoresAtivos,
    buscarPorLogin,
    buscarPorCod,
    buscarGestorAtivo,
    criar,
    atualizar,
    deletar,
};
