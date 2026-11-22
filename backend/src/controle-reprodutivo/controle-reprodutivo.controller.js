const service = require("./controle-reprodutivo.service");

// Enviar erros conhecidos e proteger os detalhes das falhas internas
function responderErro(erro, res) {
    if ([400, 404, 409].includes(erro.status)) return res.status(erro.status).json({ mensagem: erro.message });
    console.error("Falha interna no controle reprodutivo:", erro.name);
    return res.status(500).json({ mensagem: "Não foi possível realizar a operação reprodutiva." });
}

// Listar os registros de inseminação
async function listarInseminacao(req, res) {
    try {
        return res.status(200).json(await service.listar("inseminacoes", req.query));
    } catch (erro) { return responderErro(erro, res); }
}

// Buscar o registro de inseminação
async function buscarInseminacao(req, res) {
    try {
        return res.status(200).json(await service.buscarPorCod("inseminacoes", req.params.codigo));
    } catch (erro) { return responderErro(erro, res); }
}

// Validar a inseminação e registrar os vínculos e o exame opcional
async function registrarInseminacao(req, res) {
    try {
        return res.status(201).json(await service.registrarInseminacao(req.body));
    } catch (erro) { return responderErro(erro, res); }
}

// Listar os registros de diagnóstico
async function listarDiagnostico(req, res) {
    try {
        return res.status(200).json(await service.listar("diagnosticos", req.query));
    } catch (erro) { return responderErro(erro, res); }
}

// Buscar o registro de diagnóstico
async function buscarDiagnostico(req, res) {
    try {
        return res.status(200).json(await service.buscarPorCod("diagnosticos", req.params.codigo));
    } catch (erro) { return responderErro(erro, res); }
}

// Registrar o diagnóstico e atualizar o ciclo reprodutivo quando aplicável
async function registrarDiagnostico(req, res) {
    try {
        return res.status(201).json(await service.registrarDiagnostico(req.body));
    } catch (erro) { return responderErro(erro, res); }
}

// Listar os registros de gestação
async function listarGestacao(req, res) {
    try {
        return res.status(200).json(await service.listar("gestacoes", req.query));
    } catch (erro) { return responderErro(erro, res); }
}

// Buscar o registro de gestação
async function buscarGestacao(req, res) {
    try {
        return res.status(200).json(await service.buscarPorCod("gestacoes", req.params.codigo));
    } catch (erro) { return responderErro(erro, res); }
}

// Registrar a gestação de uma fêmea adquirida já prenhe
async function registrarGestacao(req, res) {
    try {
        return res.status(201).json(await service.registrarGestacao(req.body));
    } catch (erro) { return responderErro(erro, res); }
}

// Listar os registros de secagem
async function listarSecagem(req, res) {
    try {
        return res.status(200).json(await service.listar("secagens", req.query));
    } catch (erro) { return responderErro(erro, res); }
}

// Buscar o registro de secagem
async function buscarSecagem(req, res) {
    try {
        return res.status(200).json(await service.buscarPorCod("secagens", req.params.codigo));
    } catch (erro) { return responderErro(erro, res); }
}

// Registrar a secagem e atualizar a lactação quando o evento é atual
async function registrarSecagem(req, res) {
    try {
        return res.status(201).json(await service.registrarSecagem(req.body));
    } catch (erro) { return responderErro(erro, res); }
}

// Listar os registros de parto
async function listarParto(req, res) {
    try {
        return res.status(200).json(await service.listar("partos", req.query));
    } catch (erro) { return responderErro(erro, res); }
}

// Buscar o parto informado como origem do animal
async function buscarParto(req, res) {
    try {
        return res.status(200).json(await service.buscarPorCod("partos", req.params.codigo));
    } catch (erro) { return responderErro(erro, res); }
}

// Registrar o parto, vincula as crias e atualizar o ciclo da mãe
async function registrarParto(req, res) {
    try {
        return res.status(201).json(await service.registrarParto(req.body));
    } catch (erro) { return responderErro(erro, res); }
}

// Atualizar as datas previstas e a observação da gestação
async function ajustarPrevisoes(req, res) {
    try {
        return res.status(200).json(await service.ajustarPrevisoes(req.params.codigo, req.body));
    } catch (erro) { return responderErro(erro, res); }
}

// Registrar a perda gestacional e atualizar a prenhez quando aplicável
async function registrarPerda(req, res) {
    try {
        return res.status(200).json(await service.registrarPerda(req.params.codigo, req.body));
    } catch (erro) { return responderErro(erro, res); }
}

// Retornar os parâmetros utilizados pelo controle reprodutivo
async function parametros(req, res) {
    try { return res.status(200).json(service.parametros()); }
    catch (erro) { return responderErro(erro, res); }
}

module.exports = { parametros, listarInseminacao, buscarInseminacao, registrarInseminacao, listarDiagnostico, buscarDiagnostico, registrarDiagnostico, listarGestacao, buscarGestacao, registrarGestacao, listarSecagem, buscarSecagem, registrarSecagem, listarParto, buscarParto, registrarParto, ajustarPrevisoes, registrarPerda };
