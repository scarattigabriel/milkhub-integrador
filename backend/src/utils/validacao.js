// Criar um erro com mensagem e status HTTP para interromper a operação
function criarErro(status, mensagem) {
    const erro = new Error(mensagem);
    erro.status = status;
    return erro;
}

// Conferir o formato do objeto e os campos permitidos na operação
function objeto(dados, campos) {
    if (!dados || typeof dados !== "object" || Array.isArray(dados)
        || Object.keys(dados).some(campo => !campos.includes(campo))) {
        throw criarErro(400, `Informe um objeto com campos válidos: ${campos.join(", ")}.`);
    }
}

// Validar e converter um identificador inteiro positivo
function codigo(valor, campo) {
    if (!["string", "number"].includes(typeof valor) || !/^[1-9]\d*$/.test(String(valor))
        || Number(valor) > 2147483647) {
        throw criarErro(400, `${campo} deve ser um inteiro positivo válido.`);
    }
    return Number(valor);
}

// Validar e normalizar um texto obrigatório ou opcional
function texto(valor, campo, limite, opcional = false) {
    if (opcional && valor === null) return null;
    if (typeof valor !== "string" || (!opcional && !valor.trim()) || (limite && valor.trim().length > limite)) {
        throw criarErro(400, `${campo} deve ser um texto válido${limite ? ` de até ${limite} caracteres` : ""}.`);
    }
    return valor.trim() || null;
}

// Exigir fuso explícito para que a data enviada pelo navegador não seja ambígua
// Validar uma data e horário com fuso explícito
function dataHora(valor, campo, passada = false) {
    const padrao = /^(\d{4}-\d{2}-\d{2})T([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d)(?:\.(\d{1,3}))?)?(Z|[+-](?:0\d|1[0-4]):[0-5]\d)$/;
    const partes = typeof valor === "string" && padrao.exec(valor);
    const dia = partes ? new Date(`${partes[1]}T00:00:00Z`) : null;
    if (!partes || partes[1].startsWith("0000")
        || !Number.isFinite(dia.getTime()) || dia.toISOString().slice(0, 10) !== partes[1]
        || /[+-]14:(?!00)/.test(partes[6])) {
        throw criarErro(400, `${campo} deve ser uma data e horário válidos com fuso, por exemplo 2026-11-19T08:00:00-03:00.`);
    }
    const data = new Date(valor);
    if (!Number.isFinite(data.getTime()) || data.getUTCFullYear() < 1 || data.getUTCFullYear() > 9999
        || (passada && data.getTime() > Date.now())) {
        throw criarErro(400, `${campo} é inválida ou está no futuro.`);
    }
    return data;
}

// Obter a data no fuso horário da propriedade
function diaLocal(data) {
    const partes = new Intl.DateTimeFormat("en", {
        timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(new Date(data));
    const valores = Object.fromEntries(partes.map(parte => [parte.type, parte.value]));
    return `${valores.year}-${valores.month}-${valores.day}`;
}

// Validar uma data de calendário e conferir a restrição de futuro
function dataCivil(valor, campo, futura = false) {
    const data = typeof valor === "string" && /^\d{4}-\d{2}-\d{2}$/.test(valor)
        ? new Date(`${valor}T00:00:00Z`) : null;
    if (!data || !Number.isFinite(data.getTime()) || valor.startsWith("0000")
        || data.toISOString().slice(0, 10) !== valor || (!futura && valor > diaLocal(new Date()))) {
        throw criarErro(400, `${campo} deve ser uma data válida em AAAA-MM-DD${futura ? "" : ", sem estar no futuro"}.`);
    }
    return valor;
}

// Adicionar dias a uma data e conferir o limite do calendário
function somarDias(valor, dias) {
    const data = new Date(`${valor}T00:00:00Z`);
    data.setUTCDate(data.getUTCDate() + dias);
    if (data.getUTCFullYear() < 1 || data.getUTCFullYear() > 9999) throw criarErro(400, "A previsão excede as datas suportadas.");
    return data.toISOString().slice(0, 10);
}

module.exports = { criarErro, objeto, codigo, texto, dataHora, diaLocal, dataCivil, somarDias };
