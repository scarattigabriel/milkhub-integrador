const animalService = require("./animal.service");

// Enviar erros conhecidos e proteger os detalhes das falhas internas
function responderErro(erro, res) {
    if ([400, 404, 409].includes(erro.status)) {
        return res.status(erro.status).json({ mensagem: erro.message });
    }
    console.error("Falha interna na operação de animal:", erro.name);
    return res.status(500).json({ mensagem: "Não foi possível realizar a operação com o animal." });
}

// Listar os registros e enviar a resposta HTTP
async function listar(req, res) {
    try {
        return res.status(200).json(await animalService.listar(req.query));
    } catch (erro) {
        return responderErro(erro, res);
    }
}

// Consultar o registro pelo código e enviar a resposta HTTP
async function buscarPorCod(req, res) {
    try {
        return res.status(200).json(await animalService.buscarPorCod(req.params.codAnimal));
    } catch (erro) {
        return responderErro(erro, res);
    }
}

// Receber os dados e responder com o registro criado
async function criar(req, res) {
    try {
        return res.status(201).json(await animalService.criar(req.body));
    } catch (erro) {
        return responderErro(erro, res);
    }
}

// Receber as alterações e responder com o registro atualizado
async function atualizar(req, res) {
    try {
        return res.status(200).json(await animalService.atualizar(req.params.codAnimal, req.body));
    } catch (erro) {
        return responderErro(erro, res);
    }
}

// Registrar descarte ou óbito e manter o histórico do animal
async function registrarSaida(req, res) {
    try {
        return res.status(200).json(await animalService.registrarSaida(req.params.codAnimal, req.body));
    } catch (erro) {
        return responderErro(erro, res);
    }
}

// Consultar os registros que compõem o histórico do animal
async function buscarHistorico(req, res) {
    try {
        return res.status(200).json(await animalService.buscarHistorico(req.params.codAnimal));
    } catch (erro) {
        return responderErro(erro, res);
    }
}

module.exports = { listar, buscarPorCod, criar, atualizar, registrarSaida, buscarHistorico };
