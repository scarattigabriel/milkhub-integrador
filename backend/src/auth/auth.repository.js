const { Usuario } = require("../database/models");

// Buscar o usuário pelo login
async function buscarPorLogin(login) {

    return Usuario.findOne({
        where: { login },
        attributes: ["codUsuario", "nome", "login", "senha", "ativo", "perfil"],
    });
}

// Buscar o registro pelo código
async function buscarPorCod(codUsuario) {
    return Usuario.findByPk(codUsuario, {
        attributes: ["codUsuario", "nome", "login", "ativo", "perfil"],
    });
}

module.exports = { buscarPorLogin, buscarPorCod };
