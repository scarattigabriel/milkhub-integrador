const racaService = require("./raca.service");

// Enviar erros conhecidos e proteger os detalhes das falhas internas
function responderErro(erro, res) {
    if ([400, 404, 409].includes(erro.status)) {
        return res.status(erro.status).json({ mensagem: erro.message });
    }

    console.error("Falha interna na operação de raça:", erro.name);
    return res.status(500).json({ mensagem: "Não foi possível realizar a operação com a raça." });
}

// Listar os registros e enviar a resposta HTTP
async function listar(req, res) {
    try {
        const racas = await racaService.listar();
        return res.status(200).json(racas);
    } catch (erro) {
        return responderErro(erro, res);
    }
}

// Consultar o registro pelo código e enviar a resposta HTTP
async function buscarPorCod(req, res) {
    try {
        const raca = await racaService.buscarPorCod(req.params.codRaca);
        return res.status(200).json(raca);
    } catch (erro) {
        return responderErro(erro, res);
    }
}

// Receber os dados e responder com o registro criado
async function criar(req, res) {
    try {
        const raca = await racaService.criar(req.body);
        return res.status(201).json(raca);
    } catch (erro) {
        return responderErro(erro, res);
    }
}

// Receber as alterações e responder com o registro atualizado
async function atualizar(req, res) {
    try {
        const raca = await racaService.atualizar(req.params.codRaca, req.body);
        return res.status(200).json(raca);
    } catch (erro) {
        return responderErro(erro, res);
    }
}

// Excluir o registro e responder sem conteúdo
async function deletar(req, res) {
    try {
        await racaService.deletar(req.params.codRaca);
        return res.status(204).send();
    } catch (erro) {
        return responderErro(erro, res);
    }
}

module.exports = { listar, buscarPorCod, criar, atualizar, deletar };
