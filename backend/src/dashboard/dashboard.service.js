const repository = require("./dashboard.repository");
const { criarErro, objeto, dataCivil, diaLocal, somarDias } = require("../utils/validacao");
const { mensal, inicioDia } = require("../utils/periodo");
const { somar } = require("../utils/decimal");
const leiteService = require("../leite/leite.service");
const financeiroService = require("../financeiro/financeiro.service");
const usoService = require("../uso-medicamento/uso-medicamento.service");
const tratarErro = require("../utils/erro-persistencia");

// Contar os registros agrupados pelo campo informado
function agrupar(registros, campo) {
    const grupos = new Map();
    for (const registro of registros) grupos.set(registro[campo], (grupos.get(registro[campo]) || 0) + 1);
    return [...grupos].map(([valor, quantidade]) => ({ [campo]: valor, quantidade })).sort((a, b) => String(a[campo]).localeCompare(String(b[campo])));
}

// Consultar e organizar os dados necessários ao dashboard
async function consultar(filtros = {}, perfil) {
    if (!["GESTOR", "COLABORADOR"].includes(perfil)) throw criarErro(403, "Perfil sem acesso ao dashboard.");
    objeto(filtros, ["mes", "ano", "dataAgenda", "periodoAgenda"]);
    const periodo = mensal(filtros.mes, filtros.ano), agora = new Date();
    const dia = Object.hasOwn(filtros, "dataAgenda") ? dataCivil(filtros.dataAgenda, "dataAgenda", true) : diaLocal(agora);
    const modo = filtros.periodoAgenda === undefined ? "dia" : filtros.periodoAgenda;
    if (!["dia", "semana", "mes"].includes(modo)) throw criarErro(400, "periodoAgenda deve ser dia, semana ou mes.");
    let de = dia, ate = dia;
    if (modo === "semana") {
        const semana = new Date(`${dia}T12:00:00Z`).getUTCDay();
        de = somarDias(dia, -(semana === 0 ? 6 : semana - 1)); ate = somarDias(de, 6);
    } else if (modo === "mes") {
        const mes = mensal(Number(dia.slice(5, 7)), Number(dia.slice(0, 4))); de = mes.de; ate = mes.ate;
    }
    const hoje = diaLocal(agora);
    const consulta = { periodo, agora, inicioHoje: inicioDia(hoje), fimHoje: new Date(inicioDia(somarDias(hoje, 1)).getTime() - 1),
        inicioAgenda: inicioDia(de), fimAgenda: new Date(inicioDia(somarDias(ate, 1)).getTime() - 1) };
    let dados;
    try { dados = await repository.consultar(consulta, perfil); } catch (erro) { throw tratarErro(erro); }
    const ativos = dados.animais.filter(a => a.situacaoRebanho === "ATIVA");
    const coletasMes = dados.coletasAno.filter(c => c.dataColeta >= periodo.de && c.dataColeta <= periodo.ate);
    const carencias = usoService.agruparCarencias(dados.carencias);
    const resultado = {
        geradoEm: agora, referencia: { mes: periodo.mes, ano: periodo.ano, dataAgenda: dia, periodoAgenda: modo, de, ate },
        rebanho: { totalAtivos: ativos.length, totalInativos: dados.animais.length - ativos.length,
            emLactacao: ativos.filter(a => a.situacaoLactacao === "EM_LACTACAO").length, prenhas: ativos.filter(a => a.prenha === "S").length,
            porCategoria: agrupar(ativos, "categoria"), porLactacao: agrupar(ativos, "situacaoLactacao"), porPrenhez: agrupar(ativos, "prenha") },
        producao: { ...leiteService.consolidarColetas(periodo, coletasMes), valorTotalLeite: dados.fechamento?.valorTotalLeite ?? null },
        hoje: { data: hoje, total: dados.totalHoje, limite: 20, atividades: dados.hoje },
        agenda: { total: dados.totalAgenda, limite: 100, atividades: dados.agenda, porSituacao: dados.porSituacao,
            pendentes: { total: dados.totalPendentes, limite: 20, atividades: dados.pendentes } },
        carencias: { quantidadeAnimais: carencias.length, animais: carencias },
        previsoesReprodutivas: { limite: 20, gestacoes: dados.previsoes },
        producaoPorMes: Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, ano: periodo.ano,
            volumeLitros: somar(dados.coletasAno.filter(c => Number(c.dataColeta.slice(5, 7)) === i + 1).map(c => c.volumeLitros)) })),
    };
    if (perfil === "GESTOR") resultado.financeiro = financeiroService.montarResumo(periodo, dados.financeiro);
    return resultado;
}

module.exports = { consultar };
