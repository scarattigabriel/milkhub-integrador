const authService = require("../auth/auth.service");

// Verificar a autenticação e a situação atual do usuário
async function autenticar(req, res, next) {
    const cabecalho = req.headers.authorization;
    const correspondencia = typeof cabecalho === "string"
        ? /^Bearer ([^\s]+)$/i.exec(cabecalho)
        : null;

    if (!correspondencia) {
        res.set("WWW-Authenticate", "Bearer");
        return res.status(401).json({ mensagem: "Informe o token no cabeçalho Authorization: Bearer <token>." });
    }

    try {
        req.usuario = await authService.autenticar(correspondencia[1]);
    } catch (erro) {
        if (erro.status === 401) {
            res.set("WWW-Authenticate", "Bearer");
            return res.status(401).json({ mensagem: erro.message });
        }

        console.error("Falha interna ao validar a sessão:", erro.name);
        return res.status(500).json({ mensagem: "Não foi possível validar a sessão." });
    }

    return next();
}

module.exports = autenticar;
