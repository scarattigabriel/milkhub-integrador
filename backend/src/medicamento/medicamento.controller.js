const medicamentoService = require("./medicamento.service");

// Enviar erros conhecidos e proteger os detalhes das falhas internas
function responderErro(erro, res) {
    if ([400, 404, 409].includes(erro.status)) {
        return res.status(erro.status).json({ mensagem: erro.message });
    }
    console.error("Falha interna na operação de medicamento:", erro.name);
    return res.status(500).json({ mensagem: "Não foi possível realizar a operação com o medicamento." });
}

// Listar os registros e enviar a resposta HTTP
async function listar(req, res) {
    try {
        return res.status(200).json(await medicamentoService.listar(req.query));
    } catch (erro) {
        return responderErro(erro, res);
    }
}

// Consultar o registro pelo código e enviar a resposta HTTP
async function buscarPorCod(req, res) {
    try {
        return res.status(200).json(await medicamentoService.buscarPorCod(req.params.codMedicamento));
    } catch (erro) {
        return responderErro(erro, res);
    }
}

// Receber os dados e responder com o registro criado
async function criar(req, res) {
    try {
        return res.status(201).json(await medicamentoService.criar(req.body));
    } catch (erro) {
        return responderErro(erro, res);
    }
}

// Receber as alterações e responder com o registro atualizado
async function atualizar(req, res) {
    try {
        return res.status(200).json(await medicamentoService.atualizar(req.params.codMedicamento, req.body));
    } catch (erro) {
        return responderErro(erro, res);
    }
}

// Excluir o registro e responder sem conteúdo
async function deletar(req, res) {
    try {
        await medicamentoService.deletar(req.params.codMedicamento);
        return res.status(204).send();
    } catch (erro) {
        return responderErro(erro, res);
    }
}

module.exports = { listar, buscarPorCod, criar, atualizar, deletar };
