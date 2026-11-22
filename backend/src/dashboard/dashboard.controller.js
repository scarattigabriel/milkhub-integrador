const service = require("./dashboard.service");

// Enviar erros conhecidos e proteger os detalhes das falhas internas
function responderErro(erro, res) {
    if ([400, 403, 404, 409, 413].includes(erro.status)) return res.status(erro.status).json({ mensagem: erro.message });
    console.error("Falha interna na operação de dashboard:", erro.name);
    return res.status(500).json({ mensagem: "Não foi possível realizar a operação." });
}

// Consultar e organizar os dados necessários ao dashboard
async function consultar(req, res) {
    try {
        return res.status(200).json(await service.consultar(req.query, req.usuario.perfil));
    } catch (erro) { return responderErro(erro, res); }
}

module.exports = { consultar };
