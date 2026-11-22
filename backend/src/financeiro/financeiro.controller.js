const service = require("./financeiro.service");

// Enviar erros conhecidos e proteger os detalhes das falhas internas
function responderErro(erro, res) {
    if ([400, 403, 404, 409, 413].includes(erro.status)) return res.status(erro.status).json({ mensagem: erro.message });
    console.error("Falha interna na operação de financeiro:", erro.name);
    return res.status(500).json({ mensagem: "Não foi possível realizar a operação." });
}

// Listar os registros de fornecedor
async function listarFornecedor(req, res) {
    try {
        return res.status(200).json(await service.listar("fornecedores", req.query));
    } catch (erro) { return responderErro(erro, res); }
}

// Buscar pelo código o registro de fornecedor
async function buscarPorCodFornecedor(req, res) {
    try {
        return res.status(200).json(await service.buscarPorCod("fornecedores", req.params.codigo));
    } catch (erro) { return responderErro(erro, res); }
}

// Criar um registro de fornecedor
async function criarFornecedor(req, res) {
    try {
        return res.status(201).json(await service.criar("fornecedores", req.body));
    } catch (erro) { return responderErro(erro, res); }
}

// Atualizar o registro de fornecedor
async function atualizarFornecedor(req, res) {
    try {
        return res.status(200).json(await service.atualizar("fornecedores", req.params.codigo, req.body));
    } catch (erro) { return responderErro(erro, res); }
}

// Excluir o registro de fornecedor
async function deletarFornecedor(req, res) {
    try {
        await service.deletar("fornecedores", req.params.codigo);
        return res.status(204).send();
    } catch (erro) { return responderErro(erro, res); }
}

// Listar os registros de tipo de custo
async function listarTipoCusto(req, res) {
    try {
        return res.status(200).json(await service.listar("tiposCusto", req.query));
    } catch (erro) { return responderErro(erro, res); }
}

// Buscar pelo código o registro de tipo de custo
async function buscarPorCodTipoCusto(req, res) {
    try {
        return res.status(200).json(await service.buscarPorCod("tiposCusto", req.params.codigo));
    } catch (erro) { return responderErro(erro, res); }
}

// Criar um registro de tipo de custo
async function criarTipoCusto(req, res) {
    try {
        return res.status(201).json(await service.criar("tiposCusto", req.body));
    } catch (erro) { return responderErro(erro, res); }
}

// Atualizar o registro de tipo de custo
async function atualizarTipoCusto(req, res) {
    try {
        return res.status(200).json(await service.atualizar("tiposCusto", req.params.codigo, req.body));
    } catch (erro) { return responderErro(erro, res); }
}

// Excluir o registro de tipo de custo
async function deletarTipoCusto(req, res) {
    try {
        await service.deletar("tiposCusto", req.params.codigo);
        return res.status(204).send();
    } catch (erro) { return responderErro(erro, res); }
}

// Listar os registros de tipo de receita
async function listarTipoReceita(req, res) {
    try {
        return res.status(200).json(await service.listar("tiposReceita", req.query));
    } catch (erro) { return responderErro(erro, res); }
}

// Buscar pelo código o registro de tipo de receita
async function buscarPorCodTipoReceita(req, res) {
    try {
        return res.status(200).json(await service.buscarPorCod("tiposReceita", req.params.codigo));
    } catch (erro) { return responderErro(erro, res); }
}

// Criar um registro de tipo de receita
async function criarTipoReceita(req, res) {
    try {
        return res.status(201).json(await service.criar("tiposReceita", req.body));
    } catch (erro) { return responderErro(erro, res); }
}

// Atualizar o registro de tipo de receita
async function atualizarTipoReceita(req, res) {
    try {
        return res.status(200).json(await service.atualizar("tiposReceita", req.params.codigo, req.body));
    } catch (erro) { return responderErro(erro, res); }
}

// Excluir o registro de tipo de receita
async function deletarTipoReceita(req, res) {
    try {
        await service.deletar("tiposReceita", req.params.codigo);
        return res.status(204).send();
    } catch (erro) { return responderErro(erro, res); }
}

// Listar os registros de custo
async function listarCusto(req, res) {
    try {
        return res.status(200).json(await service.listar("custos", req.query));
    } catch (erro) { return responderErro(erro, res); }
}

// Buscar pelo código o registro de custo
async function buscarPorCodCusto(req, res) {
    try {
        return res.status(200).json(await service.buscarPorCod("custos", req.params.codigo));
    } catch (erro) { return responderErro(erro, res); }
}

// Criar um registro de custo
async function criarCusto(req, res) {
    try {
        return res.status(201).json(await service.criar("custos", req.body));
    } catch (erro) { return responderErro(erro, res); }
}

// Atualizar o registro de custo
async function atualizarCusto(req, res) {
    try {
        return res.status(200).json(await service.atualizar("custos", req.params.codigo, req.body));
    } catch (erro) { return responderErro(erro, res); }
}

// Excluir o registro de custo
async function deletarCusto(req, res) {
    try {
        await service.deletar("custos", req.params.codigo);
        return res.status(204).send();
    } catch (erro) { return responderErro(erro, res); }
}

// Listar os registros de receita
async function listarReceita(req, res) {
    try {
        return res.status(200).json(await service.listar("receitas", req.query));
    } catch (erro) { return responderErro(erro, res); }
}

// Buscar pelo código o registro de receita
async function buscarPorCodReceita(req, res) {
    try {
        return res.status(200).json(await service.buscarPorCod("receitas", req.params.codigo));
    } catch (erro) { return responderErro(erro, res); }
}

// Criar um registro de receita
async function criarReceita(req, res) {
    try {
        return res.status(201).json(await service.criar("receitas", req.body));
    } catch (erro) { return responderErro(erro, res); }
}

// Atualizar o registro de receita
async function atualizarReceita(req, res) {
    try {
        return res.status(200).json(await service.atualizar("receitas", req.params.codigo, req.body));
    } catch (erro) { return responderErro(erro, res); }
}

// Excluir o registro de receita
async function deletarReceita(req, res) {
    try {
        await service.deletar("receitas", req.params.codigo);
        return res.status(204).send();
    } catch (erro) { return responderErro(erro, res); }
}

// Consultar os lançamentos e montar o resumo financeiro do período
async function resumo(req, res) {
    try {
        return res.status(200).json(await service.resumo(req.query));
    } catch (erro) { return responderErro(erro, res); }
}

module.exports = { listarFornecedor, buscarPorCodFornecedor, criarFornecedor, atualizarFornecedor, deletarFornecedor, listarTipoCusto, buscarPorCodTipoCusto, criarTipoCusto, atualizarTipoCusto, deletarTipoCusto, listarTipoReceita, buscarPorCodTipoReceita, criarTipoReceita, atualizarTipoReceita, deletarTipoReceita, listarCusto, buscarPorCodCusto, criarCusto, atualizarCusto, deletarCusto, listarReceita, buscarPorCodReceita, criarReceita, atualizarReceita, deletarReceita, resumo };
