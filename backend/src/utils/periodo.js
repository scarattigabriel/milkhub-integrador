const { criarErro, dataCivil, diaLocal } = require("./validacao");

// Validar e converter um número inteiro dentro dos limites informados
function inteiro(valor, campo, minimo, maximo) {
    if (!["number", "string"].includes(typeof valor) || !/^\d+$/.test(String(valor)) || Number(valor) < minimo || Number(valor) > maximo) {
        throw criarErro(400, `${campo} deve estar entre ${minimo} e ${maximo}.`);
    }
    return Number(valor);
}

// Montar as datas de início e fim do mês informado
function mensal(mes, ano) {
    const hoje = diaLocal(new Date());
    const m = mes === undefined ? Number(hoje.slice(5, 7)) : inteiro(mes, "mes", 1, 12);
    const a = ano === undefined ? Number(hoje.slice(0, 4)) : inteiro(ano, "ano", 1, 9999);
    const inicio = `${String(a).padStart(4, "0")}-${String(m).padStart(2, "0")}-01`;
    const fimData = new Date(`${inicio}T00:00:00Z`);
    fimData.setUTCMonth(fimData.getUTCMonth() + 1, 0);
    return { mes: m, ano: a, de: inicio, ate: fimData.toISOString().slice(0, 10) };
}

// Validar o intervalo de datas ou a referência mensal da consulta
function intervalo(filtros) {
    const temIntervalo = Object.hasOwn(filtros, "de") || Object.hasOwn(filtros, "ate");
    if (temIntervalo && (Object.hasOwn(filtros, "mes") || Object.hasOwn(filtros, "ano"))) throw criarErro(400, "Use mês/ano ou de/ate, sem combinar os dois formatos.");
    if (!temIntervalo) return mensal(filtros.mes, filtros.ano);
    const de = dataCivil(filtros.de, "de", true), ate = dataCivil(filtros.ate, "ate", true);
    if (de > ate) throw criarErro(400, "O início deve anteceder o fim do período.");
    return { de, ate };
}

// Resolver o início de uma data civil no fuso da propriedade, sem depender do TZ do processo
// Obter o horário inicial do dia no fuso da propriedade
function inicioDia(dia) {
    dataCivil(dia, "data", true);
    const utc = new Date(`${dia}T00:00:00Z`).getTime();
    let inicio = Math.max(utc - 36 * 3600000, new Date("0001-01-01T00:00:00Z").getTime());
    let fim = utc + 36 * 3600000;
    const alvo = Number(dia.replaceAll("-", ""));
    const formato = new Intl.DateTimeFormat("en", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" });
    // Buscar o primeiro instante da data, inclusive quando o horário de verão

    while (inicio < fim) {
        const meio = Math.floor((inicio + fim) / 2);
        const partes = Object.fromEntries(formato.formatToParts(new Date(meio)).map(p => [p.type, p.value]));
        const local = Number(partes.year) * 10000 + Number(partes.month) * 100 + Number(partes.day);
        if (local < alvo) inicio = meio + 1;
        else fim = meio;
    }
    return new Date(inicio);
}

module.exports = { inteiro, mensal, intervalo, inicioDia };
