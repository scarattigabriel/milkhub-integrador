// Validar e retornar a configuração de assinatura e expiração do JWT
function obterConfiguracaoToken() {
    const segredo = process.env.JWT_SECRET;
    const expiracao = process.env.JWT_EXPIRACAO_SEGUNDOS || "3600";

    if (typeof segredo !== "string" || Buffer.byteLength(segredo, "utf8") < 32) {
        throw new Error("Configure JWT_SECRET com pelo menos 32 bytes.");
    }

    if (!/^[1-9]\d*$/.test(expiracao) || Number(expiracao) > 2147483647) {
        throw new Error("JWT_EXPIRACAO_SEGUNDOS deve ser um inteiro positivo válido.");
    }

    return {
        segredo,
        expiraEm: Number(expiracao),
        algoritmo: "HS256",
        emissor: "gestao-leiteira",
        destinatario: "gestao-leiteira-api",
    };
}

module.exports = { obterConfiguracaoToken };
