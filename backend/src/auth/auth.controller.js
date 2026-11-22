const authService = require("./auth.service");

// Validar as credenciais e devolver o token com os dados públicos do usuário
async function login(req, res) {

    res.set("Cache-Control", "no-store");

    try {
        const resultado = await authService.login(req.body);
        return res.status(200).json(resultado);
    } catch (erro) {
        if ([400, 401].includes(erro.status)) {
            if (erro.status === 401) res.set("WWW-Authenticate", "Bearer");
            return res.status(erro.status).json({ mensagem: erro.message });
        }

        console.error("Falha interna na autenticação:", erro.name);
        return res.status(500).json({ mensagem: "Não foi possível realizar o login." });
    }
}

// Retornar os dados públicos do usuário autenticado
function me(req, res) {
    res.set("Cache-Control", "no-store");
    return res.status(200).json(req.usuario);
}

module.exports = { login, me };
