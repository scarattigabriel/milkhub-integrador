// Permitir a operação apenas aos perfis informados
function autorizar(...perfis) {
    if (perfis.length === 0 || perfis.some(perfil => !["GESTOR", "COLABORADOR"].includes(perfil))) {
        throw new Error("Informe ao menos um perfil válido na configuração da autorização.");
    }

    return (req, res, next) => {
        if (!req.usuario || req.usuario.ativo !== true) {
            return res.status(401).json({ mensagem: "Autenticação necessária." });
        }

        if (!perfis.includes(req.usuario.perfil)) {
            return res.status(403).json({ mensagem: "Seu perfil não tem permissão para esta operação." });
        }

        return next();
    };
}

module.exports = autorizar;
