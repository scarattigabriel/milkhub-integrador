const { criarErro } = require("../utils/validacao");

const TIPOS = ["TRABALHO", "EXAME", "VACINACAO", "TRATAMENTO", "APLICACAO_MEDICAMENTO", "DESALEITAMENTO", "OUTRA"];
const ALIASES = {
    VACINA: "VACINACAO", VACINAS: "VACINACAO",
    APLICACAO_DE_MEDICAMENTOS: "APLICACAO_MEDICAMENTO", APLICACAO_DE_MEDICAMENTO: "APLICACAO_MEDICAMENTO",
    APLICACAO_MEDICAMENTOS: "APLICACAO_MEDICAMENTO", TRATAMENTO_MEDICAMENTOSO: "TRATAMENTO",
};

// Normalizar e validar o tipo de atividade informado
function normalizarTipo(valor) {
    if (typeof valor !== "string" || !valor.trim() || valor.trim().length > 50) throw criarErro(400, "Informe um tipo de atividade válido.");
    const chave = valor.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/[\s-]+/g, "_");
    const tipo = ALIASES[chave] || chave;
    if (!TIPOS.includes(tipo)) throw criarErro(400, `Tipo inválido. Use ${TIPOS.join(", ")}; detalhes adicionais pertencem à descrição.`);
    return tipo;
}

// Identificar os tipos de atividade que exigem aplicações de medicamentos
function tipoSanitario(valor) {
    return ["VACINACAO", "TRATAMENTO", "APLICACAO_MEDICAMENTO"].includes(normalizarTipo(valor));
}

module.exports = { TIPOS, normalizarTipo, tipoSanitario };
