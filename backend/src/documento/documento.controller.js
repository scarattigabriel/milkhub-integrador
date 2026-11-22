const service = require("./documento.service");

// Enviar erros conhecidos e proteger os detalhes das falhas internas
function responderErro(erro, res) {
    if ([400, 403, 404, 409, 413, 415].includes(erro.status)) return res.status(erro.status).json({ mensagem: erro.message });
    console.error("Falha interna na operação de documento:", erro.name);
    return res.status(500).json({ mensagem: "Não foi possível realizar a operação." });
}

// Validar o arquivo e registrar o documento com seus vínculos
async function anexar(req, res) {
    try {
        return res.status(201).json(await service.anexar(req.query, req.body, req.get("Content-Type")));
    } catch (erro) { return responderErro(erro, res); }
}

// Listar os registros e enviar a resposta HTTP
async function listar(req, res) {
    try {
        return res.status(200).json(await service.listar(req.query, req.usuario.perfil));
    } catch (erro) { return responderErro(erro, res); }
}

// Consultar o registro pelo código e enviar a resposta HTTP
async function buscarPorCod(req, res) {
    try {
        return res.status(200).json(await service.buscarPorCod(req.params.codigo, req.usuario.perfil));
    } catch (erro) { return responderErro(erro, res); }
}

// Excluir o registro e responder sem conteúdo
async function deletar(req, res) {
    try {
        await service.deletar(req.params.codigo);
        return res.status(204).send();
    } catch (erro) { return responderErro(erro, res); }
}

// Buscar o documento autorizado e devolver seu conteúdo para download
async function baixar(req, res) {
    try {
        const arquivo = await service.baixar(req.params.codigo, req.usuario.perfil);
        res.set("X-Content-Type-Options", "nosniff");
        return res.type(arquivo.mime).attachment(arquivo.nomeArquivo).send(arquivo.buffer);
    } catch (erro) { return responderErro(erro, res); }
}

module.exports = { baixar, anexar, listar, buscarPorCod, deletar };
