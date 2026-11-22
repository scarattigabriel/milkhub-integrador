const usuarioService = require("./usuario.service");

// Enviar erros conhecidos e proteger os detalhes das falhas internas
function responderErro(erro, res) {
    if ([400, 404, 409].includes(erro.status)) {
        return res.status(erro.status).json({ mensagem: erro.message });
    }

    console.error("Falha interna na operação de usuário:", erro.name);
    return res.status(500).json({
        mensagem: "Não foi possível realizar a operação com o usuário.",
    });
}

// Consultar o usuário pelo login e enviar a resposta HTTP
async function buscarPorLogin(req, res) {
    try {
        const usuario = await usuarioService.buscarPorLogin(req.query.login);

        if (!usuario) {
            return res.status(404).json({ mensagem: "Usuário não encontrado." });
        }

        return res.status(200).json(usuario);
    } catch (erro) {
        return responderErro(erro, res);
    }
}

// Consultar o registro pelo código e enviar a resposta HTTP
async function buscarPorCod(req, res) {
    try {
        const usuario = await usuarioService.buscarPorCod(req.params.codUsuario);
        return res.status(200).json(usuario);
    } catch (erro) {
        return responderErro(erro, res);
    }
}

// Receber os dados e responder com o registro criado
async function criar(req, res) {
    try {
        const usuario = await usuarioService.criar(req.body);
        return res.status(201).json(usuario);
    } catch (erro) {
        return responderErro(erro, res);
    }
}

// Receber as alterações e responder com o registro atualizado
async function atualizar(req, res) {
    try {
        const usuario = await usuarioService.atualizar(req.params.codUsuario, req.body);
        return res.status(200).json(usuario);
    } catch (erro) {
        return responderErro(erro, res);
    }
}

// Excluir o registro e responder sem conteúdo
async function deletar(req, res) {
    try {
        await usuarioService.deletar(req.params.codUsuario);
        return res.status(204).send();
    } catch (erro) {
        return responderErro(erro, res);
    }
}

// Listar os registros e enviar a resposta HTTP
async function listar(req, res) {
    try { return res.status(200).json(await usuarioService.listar(req.query)); }
    catch (erro) { return responderErro(erro, res); }
}

module.exports = { listar, buscarPorLogin, buscarPorCod, criar, atualizar, deletar };
