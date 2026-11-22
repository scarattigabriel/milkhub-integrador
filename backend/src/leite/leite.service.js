const repository = require("./leite.repository");
const financeiroRepository = require("../financeiro/financeiro.repository");
const { criarErro, objeto, codigo, texto, dataCivil, diaLocal, somarDias } = require("../utils/validacao");
const { mensal, inteiro, intervalo } = require("../utils/periodo");
const { decimal, somar } = require("../utils/decimal");
const tratarErro = require("../utils/erro-persistencia");

// Conferir data, volume e campos opcionais da coleta
function validarColeta(dados, parcial = false) {
    objeto(dados, ["dataColeta", "volumeLitros", "horarioColeta", "resultadoAlizarol", "observacao", "codFechamento"]);
    if (!Object.keys(dados).length) throw criarErro(400, "Informe os dados da coleta.");
    const valores = {};
    if (!parcial || Object.hasOwn(dados, "dataColeta")) valores.dataColeta = dataCivil(dados.dataColeta, "dataColeta");
    if (!parcial || Object.hasOwn(dados, "volumeLitros")) valores.volumeLitros = decimal(dados.volumeLitros, "volumeLitros", 8);
    for (const [campo, limite] of [["resultadoAlizarol", 30], ["observacao", null]]) {
        if (Object.hasOwn(dados, campo)) valores[campo] = texto(dados[campo], campo, limite, true);
        else if (!parcial) valores[campo] = null;
    }
    if (Object.hasOwn(dados, "horarioColeta")) {
        if (dados.horarioColeta !== null && (typeof dados.horarioColeta !== "string" || !/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(dados.horarioColeta))) throw criarErro(400, "horarioColeta deve ser HH:mm ou HH:mm:ss, ou null.");
        valores.horarioColeta = dados.horarioColeta === null ? null : dados.horarioColeta.length === 5 ? `${dados.horarioColeta}:00` : dados.horarioColeta;
    } else if (!parcial) valores.horarioColeta = null;
    if (Object.hasOwn(dados, "codFechamento")) valores.codFechamento = dados.codFechamento === null ? null : codigo(dados.codFechamento, "codFechamento");
    return valores;
}

// Impedir registrar uma coleta com horário futuro
function validarHorario(coleta) {
    if (coleta.horarioColeta && coleta.dataColeta === diaLocal(new Date())) {
        const hora = new Intl.DateTimeFormat("en-GB", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).format(new Date());
        if (coleta.horarioColeta > hora) throw criarErro(400, "O horário da coleta realizada não pode estar no futuro.");
    }
}

// Buscar ou criar o fechamento mensal correspondente à coleta
async function obterFechamentoDaColeta(valores, tx) {
    const mes = Number(valores.dataColeta.slice(5, 7)), ano = Number(valores.dataColeta.slice(0, 4));
    if (valores.codFechamento != null) {
        const fechamento = await repository.buscarFechamento(valores.codFechamento, tx);
        if (!fechamento || fechamento.mesReferencia !== mes || fechamento.anoReferencia !== ano) throw criarErro(400, "O fechamento deve existir e corresponder ao mês da coleta.");
        return fechamento.codFechamento;
    }
    const fechamento = await repository.fechamentoDoMes(mes, ano, tx)
        || await repository.criarFechamento({ mesReferencia: mes, anoReferencia: ano, valorTotalLeite: null, observacao: null }, tx);
    return fechamento.codFechamento;
}

// Criar um registro de coleta
async function criarColeta(dados) {
    const valores = validarColeta(dados); validarHorario(valores);
    try {
        return await repository.executarEmTransacao(async tx => {
            valores.codFechamento = await obterFechamentoDaColeta(valores, tx);
            return repository.criarColeta(valores, tx);
        });
    } catch (erro) { throw tratarErro(erro); }
}

// Atualizar o registro de coleta
async function atualizarColeta(id, dados) {
    const chave = codigo(id, "codColeta"), valores = validarColeta(dados, true);
    try {
        return await repository.executarEmTransacao(async tx => {
            const coleta = await repository.buscarColeta(chave, tx);
            if (!coleta) throw criarErro(404, "Coleta não encontrada.");
            const completo = { ...coleta.get({ plain: true }), ...valores };
            validarHorario(completo);

            if (Object.hasOwn(valores, "dataColeta") && !Object.hasOwn(valores, "codFechamento")) completo.codFechamento = null;
            valores.codFechamento = await obterFechamentoDaColeta(completo, tx);
            return repository.atualizar(coleta, valores, tx);
        });
    } catch (erro) { throw tratarErro(erro); }
}

// Excluir o registro de coleta
async function deletarColeta(id) {
    const chave = codigo(id, "codColeta");
    try {
        await repository.executarEmTransacao(async tx => {
            const coleta = await repository.buscarColeta(chave, tx);
            if (!coleta) throw criarErro(404, "Coleta não encontrada.");
            await repository.deletarColeta(coleta, tx);
        });
    } catch (erro) { throw tratarErro(erro); }
}
// Buscar o registro de coleta
async function buscarColeta(id) {
    const coleta = await repository.detalhesColeta(codigo(id, "codColeta"));
    if (!coleta) throw criarErro(404, "Coleta não encontrada.");
    return coleta;
}
// Listar os registros de coleta
async function listarColetas(filtros = {}) {
    objeto(filtros, ["mes", "ano", "de", "ate", "codFechamento"]);
    const valores = {};
    if (["mes", "ano", "de", "ate"].some(c => Object.hasOwn(filtros, c))) {
        const periodo = intervalo(filtros); valores.de = periodo.de; valores.ate = periodo.ate;
    }
    if (Object.hasOwn(filtros, "codFechamento")) valores.codFechamento = codigo(filtros.codFechamento, "codFechamento");
    return repository.listarColetas(valores);
}

// Atualizar a receita vinculada quando o valor do leite muda
async function sincronizarValor(fechamento, valor, tx) {
    const receita = await financeiroRepository.receitaDoFechamento(fechamento.codFechamento, tx);
    if (receita && valor === null) throw criarErro(409, "Remova a receita vinculada antes de limpar o valor total do leite.");
    if (receita) await financeiroRepository.atualizar(receita, { valor: decimal(valor, "valor da receita do leite", 10) }, tx);
}

// Criar um registro de fechamento
async function criarFechamento(dados) {
    objeto(dados, ["mesReferencia", "anoReferencia", "valorTotalLeite", "observacao"]);
    const valores = { mesReferencia: inteiro(dados.mesReferencia, "mesReferencia", 1, 12), anoReferencia: inteiro(dados.anoReferencia, "anoReferencia", 1, 9999),
        valorTotalLeite: dados.valorTotalLeite == null ? null : decimal(dados.valorTotalLeite, "valorTotalLeite", 12),
        observacao: dados.observacao === undefined ? null : texto(dados.observacao, "observacao", null, true) };
    try { return await repository.criarFechamento(valores); } catch (erro) { throw tratarErro(erro); }
}

// Atualizar o fechamento e sincronizar a receita dentro da transação atual
async function atualizarFechamentoNaTransacao(fechamento, dados, tx) {
    objeto(dados, ["valorTotalLeite", "observacao"]);
    if (!Object.keys(dados).length) throw criarErro(400, "Informe os dados a alterar no fechamento.");
    const valores = {};
    if (Object.hasOwn(dados, "valorTotalLeite")) {
        valores.valorTotalLeite = dados.valorTotalLeite === null ? null : decimal(dados.valorTotalLeite, "valorTotalLeite", 12);
        await sincronizarValor(fechamento, valores.valorTotalLeite, tx);
    }
    if (Object.hasOwn(dados, "observacao")) valores.observacao = texto(dados.observacao, "observacao", null, true);
    return repository.atualizar(fechamento, valores, tx);
}

// Atualizar o registro de fechamento
async function atualizarFechamento(id, dados) {
    const chave = codigo(id, "codFechamento");
    try {
        return await repository.executarEmTransacao(async tx => {
            const fechamento = await repository.buscarFechamento(chave, tx);
            if (!fechamento) throw criarErro(404, "Fechamento não encontrado.");
            return atualizarFechamentoNaTransacao(fechamento, dados, tx);
        });
    } catch (erro) { throw tratarErro(erro); }
}
// Buscar o registro de fechamento
async function buscarFechamento(id) {
    const fechamento = await repository.buscarFechamento(codigo(id, "codFechamento"));
    if (!fechamento) throw criarErro(404, "Fechamento não encontrado.");
    return fechamento;
}
// Listar os registros de fechamento
async function listarFechamentos(filtros = {}) {
    objeto(filtros, ["mes", "ano"]); const valores = {};
    if (Object.hasOwn(filtros, "mes")) valores.mesReferencia = inteiro(filtros.mes, "mes", 1, 12);
    if (Object.hasOwn(filtros, "ano")) valores.anoReferencia = inteiro(filtros.ano, "ano", 1, 9999);
    return repository.listarFechamentos(valores);
}

// Somar os volumes e preencher os dias do período sem coleta
function consolidarColetas(periodo, coletas) {
    const porDia = new Map();
    for (let dia = periodo.de; dia <= periodo.ate; dia = somarDias(dia, 1)) {
        porDia.set(dia, []); if (dia === periodo.ate) break;
    }
    for (const coleta of coletas) porDia.get(coleta.dataColeta)?.push(coleta.volumeLitros);
    return { totalLitros: somar(coletas.map(c => c.volumeLitros)), quantidadeColetas: coletas.length,
        porDia: [...porDia].map(([data, volumes]) => ({ data, volumeLitros: somar(volumes) })) };
}

// Reunir produção, fechamento, documentos e qualidade do leite no mês
async function resumoMensal(filtros = {}) {
    objeto(filtros, ["mes", "ano"]); const periodo = mensal(filtros.mes, filtros.ano);
    try {
        return await repository.executarEmTransacao(async tx => {
            const fechamento = await repository.fechamentoDoMes(periodo.mes, periodo.ano, tx);
            const coletas = await repository.listarColetas(periodo, tx);
            const documentos = fechamento ? await repository.documentosDoFechamento(fechamento.codFechamento, tx) : [];
            const documentoRepository = require("../documento/documento.repository");
            const qualidade = fechamento ? await documentoRepository.qualidadeDoFechamento(fechamento.codFechamento, tx) : null;
            const indicesQualidade = qualidade ? JSON.parse((await documentoRepository.lerArquivo(qualidade.referenciaArquivo)).toString("utf8")).indices : [];
            return { periodo, ...consolidarColetas(periodo, coletas), valorTotalLeite: fechamento?.valorTotalLeite ?? null,
                fechamento, documentos, indicesQualidade };
        });
    } catch (erro) { throw tratarErro(erro); }
}

module.exports = { criarColeta, atualizarColeta, deletarColeta, buscarColeta, listarColetas, criarFechamento,
    atualizarFechamento, atualizarFechamentoNaTransacao, buscarFechamento, listarFechamentos, resumoMensal, consolidarColetas };
