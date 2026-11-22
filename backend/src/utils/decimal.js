const { criarErro } = require("./validacao");

// Validar e normalizar um valor decimal sem arredondar a entrada
function decimal(valor, campo, inteiros = 10) {
    if (!["string", "number"].includes(typeof valor) || !/^\d+(?:\.\d{1,2})?$/.test(String(valor))) {
        throw criarErro(400, `${campo} deve ser um decimal não negativo, com ponto e até duas casas.`);
    }
    const [parteInteira, fracao = ""] = String(valor).split(".");
    const normalizada = parteInteira.replace(/^0+(?=\d)/, "");
    if (normalizada.length > inteiros) throw criarErro(400, `${campo} excede o limite do banco.`);
    return `${normalizada}.${fracao.padEnd(2, "0")}`;
}

// Converter um valor decimal para centavos inteiros
function centavos(valor) {
    return BigInt(decimal(valor, "valor", 40).replace(".", ""));
}

// Converter centavos inteiros para uma string decimal
function formatar(valor) {
    const negativo = valor < 0n;
    const numero = negativo ? -valor : valor;
    return `${negativo ? "-" : ""}${numero / 100n}.${String(numero % 100n).padStart(2, "0")}`;
}

// Somar valores decimais usando centavos inteiros
function somar(valores) { return formatar(valores.reduce((total, valor) => total + centavos(valor), 0n)); }

module.exports = { decimal, centavos, formatar, somar };
