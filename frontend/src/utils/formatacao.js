const fuso = "America/Sao_Paulo";
export const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
// Formatar um número no padrão brasileiro
export const numero = valor => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(Number(valor));
// Formatar um valor em reais
export const moeda = valor => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor));

// Formatar uma data de calendário sem trocar o dia
export function dataCivil(valor) {
    return valor ? new Intl.DateTimeFormat("pt-BR", { timeZone: fuso }).format(new Date(`${valor}T12:00:00Z`)) : "Não informada";
}

// Formatar a data e o horário para mostrar na tela
export function dataHora(valor) {
    return valor ? new Intl.DateTimeFormat("pt-BR", { timeZone: fuso, dateStyle: "short", timeStyle: "short" }).format(new Date(valor)) : "Não informado";
}

// Montar os filtros iniciais da consulta
export function filtrosIniciais(agora = new Date()) {
    const partes = Object.fromEntries(new Intl.DateTimeFormat("en", {
        timeZone: fuso, year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(agora).map(p => [p.type, p.value]));
    return { mes: Number(partes.month), ano: Number(partes.year),
        dataAgenda: `${partes.year}-${partes.month}-${partes.day}`, periodoAgenda: "dia" };
}

const rotulos = { EM_LACTACAO: "Em lactação", SECA: "Secas", NAO_SE_APLICA: "Não se aplica",
    TRABALHO: "Trabalho", EXAME: "Exame", MEDICAMENTO: "Medicamento" };
// Transformar o código da situação em um texto para a tela
export function rotulo(valor) {
    return rotulos[valor] || String(valor ?? "Não informado").replaceAll("_", " ").toLocaleLowerCase("pt-BR");
}

// Montar a identificação do animal pelo nome e pelo brinco
export const identificarAnimal = animal => animal
    ? `${animal.nome || "Animal"} · brinco ${animal.brinco ?? "não informado"}` : "Animal não informado";
