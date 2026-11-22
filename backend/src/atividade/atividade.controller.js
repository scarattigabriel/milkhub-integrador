const atividadeService = require("./atividade.service");

// Enviar erros conhecidos e proteger os detalhes das falhas internas
function responderErro(erro, res) {
    if ([400, 404, 409].includes(erro.status)) {
        return res.status(erro.status).json({ mensagem: erro.message });
    }
    console.error("Falha interna na operação de atividade:", erro.name);
    return res.status(500).json({ mensagem: "Não foi possível realizar a operação de atividade." });
}

// Listar os registros e enviar a resposta HTTP
async function listar(req, res) {
    try {
        return res.status(200).json(await atividadeService.listar(req.query));
    } catch (erro) {
        return responderErro(erro, res);
    }
}

// Consultar o registro pelo código e enviar a resposta HTTP
async function buscarPorCod(req, res) {
    try {
        return res.status(200).json(await atividadeService.buscarPorCod(req.params.codAtividade));
    } catch (erro) {
        return responderErro(erro, res);
    }
}

// Receber os dados e responder com o registro criado
async function criar(req, res) {
    try {
        return res.status(201).json(await atividadeService.criar(req.body));
    } catch (erro) {
        return responderErro(erro, res);
    }
}

// Receber as alterações e responder com o registro atualizado
async function atualizar(req, res) {
    try {
        return res.status(200).json(await atividadeService.atualizar(req.params.codAtividade, req.body));
    } catch (erro) {
        return responderErro(erro, res);
    }
}

// Concluir a atividade e confirmar as aplicações vinculadas
async function concluir(req, res) {
    try {
        return res.status(200).json(await atividadeService.concluir(req.params.codAtividade, req.body));
    } catch (erro) {
        return responderErro(erro, res);
    }
}

// Cancelar a atividade sem iniciar aplicações ou carências
async function cancelar(req, res) {
    try {
        return res.status(200).json(await atividadeService.cancelar(req.params.codAtividade, req.body));
    } catch (erro) {
        return responderErro(erro, res);
    }
}

module.exports = { listar, buscarPorCod, criar, atualizar, concluir, cancelar };
