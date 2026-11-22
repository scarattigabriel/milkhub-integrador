const reprodutorService = require("./reprodutor.service");

// Enviar erros conhecidos e proteger os detalhes das falhas internas
function responderErro(erro, res) {
    if ([400, 404, 409].includes(erro.status)) {
        return res.status(erro.status).json({ mensagem: erro.message });
    }
    console.error("Falha interna na operação de reprodutor:", erro.name);
    return res.status(500).json({ mensagem: "Não foi possível realizar a operação com o reprodutor." });
}

// Listar os registros e enviar a resposta HTTP
async function listar(req, res) {
    try {
        return res.status(200).json(await reprodutorService.listar(req.query));
    } catch (erro) {
        return responderErro(erro, res);
    }
}

// Consultar o registro pelo código e enviar a resposta HTTP
async function buscarPorCod(req, res) {
    try {
        return res.status(200).json(await reprodutorService.buscarPorCod(req.params.codReprodutor));
    } catch (erro) {
        return responderErro(erro, res);
    }
}

// Receber os dados e responder com o registro criado
async function criar(req, res) {
    try {
        return res.status(201).json(await reprodutorService.criar(req.body));
    } catch (erro) {
        return responderErro(erro, res);
    }
}

// Receber as alterações e responder com o registro atualizado
async function atualizar(req, res) {
    try {
        return res.status(200).json(await reprodutorService.atualizar(req.params.codReprodutor, req.body));
    } catch (erro) {
        return responderErro(erro, res);
    }
}

// Excluir o registro e responder sem conteúdo
async function deletar(req, res) {
    try {
        await reprodutorService.deletar(req.params.codReprodutor);
        return res.status(204).send();
    } catch (erro) {
        return responderErro(erro, res);
    }
}

module.exports = { listar, buscarPorCod, criar, atualizar, deletar };
