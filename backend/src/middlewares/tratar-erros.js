// Responder a erros de requisição sem expor detalhes internos
function tratarErros(erro, req, res, next) {
    if (res.headersSent) return next(erro);
    if (erro.type === "entity.too.large" || erro.status === 413) return res.status(413).json({ mensagem: "O corpo da requisição excede o tamanho permitido." });
    if (erro.type === "entity.parse.failed") return res.status(400).json({ mensagem: "JSON inválido." });
    if (["encoding.unsupported", "charset.unsupported"].includes(erro.type)) {
        if (erro.type === "encoding.unsupported") res.set("Accept-Encoding", "identity");
        return res.status(415).json({ mensagem: "O formato ou a codificação do corpo da requisição não é aceito." });
    }
    console.error("Falha interna ao processar requisição:", erro.name);
    return res.status(500).json({ mensagem: "Não foi possível processar a requisição." });
}

module.exports = tratarErros;
