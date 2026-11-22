const service = require("./leite.service");
const documentoService = require("../documento/documento.service");

// Enviar erros conhecidos e proteger os detalhes das falhas internas
function responderErro(erro, res) {
    if ([400, 403, 404, 409, 413].includes(erro.status)) return res.status(erro.status).json({ mensagem: erro.message });
    console.error("Falha interna na operação de leite:", erro.name);
    return res.status(500).json({ mensagem: "Não foi possível realizar a operação." });
}

// Listar os registros de coleta
async function listarColetas(req, res) {
    try {
        return res.status(200).json(await service.listarColetas(req.query));
    } catch (erro) { return responderErro(erro, res); }
}

// Buscar o registro de coleta
async function buscarColeta(req, res) {
    try {
        return res.status(200).json(await service.buscarColeta(req.params.codigo));
    } catch (erro) { return responderErro(erro, res); }
}

// Criar um registro de coleta
async function criarColeta(req, res) {
    try {
        return res.status(201).json(await service.criarColeta(req.body));
    } catch (erro) { return responderErro(erro, res); }
}

// Atualizar o registro de coleta
async function atualizarColeta(req, res) {
    try {
        return res.status(200).json(await service.atualizarColeta(req.params.codigo, req.body));
    } catch (erro) { return responderErro(erro, res); }
}

// Excluir o registro de coleta
async function deletarColeta(req, res) {
    try {
        await service.deletarColeta(req.params.codigo);
        return res.status(204).send();
    } catch (erro) { return responderErro(erro, res); }
}

// Listar os registros de fechamento
async function listarFechamentos(req, res) {
    try {
        return res.status(200).json(await service.listarFechamentos(req.query));
    } catch (erro) { return responderErro(erro, res); }
}

// Buscar o registro de fechamento
async function buscarFechamento(req, res) {
    try {
        return res.status(200).json(await service.buscarFechamento(req.params.codigo));
    } catch (erro) { return responderErro(erro, res); }
}

// Criar um registro de fechamento
async function criarFechamento(req, res) {
    try {
        return res.status(201).json(await service.criarFechamento(req.body));
    } catch (erro) { return responderErro(erro, res); }
}

// Atualizar o registro de fechamento
async function atualizarFechamento(req, res) {
    try {
        return res.status(200).json(await service.atualizarFechamento(req.params.codigo, req.body));
    } catch (erro) { return responderErro(erro, res); }
}

// Reunir produção, fechamento, documentos e qualidade do leite no mês
async function resumoMensal(req, res) {
    try {
        return res.status(200).json(await service.resumoMensal(req.query));
    } catch (erro) { return responderErro(erro, res); }
}

// Validar e salvar os índices de qualidade do fechamento mensal
async function registrarQualidade(req, res) {
    try {
        return res.status(200).json(await documentoService.registrarQualidade(req.params.codigo, req.body));
    } catch (erro) { return responderErro(erro, res); }
}

module.exports = { listarColetas, buscarColeta, criarColeta, atualizarColeta, deletarColeta, listarFechamentos, buscarFechamento, criarFechamento, atualizarFechamento, resumoMensal, registrarQualidade };
