const repository = require("./financeiro.repository");
const leiteRepository = require("../leite/leite.repository");
const { criarErro, objeto, codigo, texto, dataCivil } = require("../utils/validacao");
const { decimal, centavos, formatar } = require("../utils/decimal");
const { intervalo } = require("../utils/periodo");
const tratarErro = require("../utils/erro-persistencia");

const CATALOGOS = ["fornecedores", "tiposCusto", "tiposReceita"];

// Conferir e normalizar os campos enviados para a operação
function validarDados(tipo, dados, parcial = false) {
    const catalogo = CATALOGOS.includes(tipo), custo = tipo === "custos";
    const campos = catalogo ? ["nome", ...(tipo === "fornecedores" ? ["contato"] : [])]
        : ["descricao", "valor", custo ? "dataCusto" : "dataReceita", custo ? "codTipoCusto" : "codTipoReceita",
            ...(custo ? ["codFornecedor"] : (!parcial ? ["codFechamento"] : []))];
    objeto(dados, campos);
    if (!Object.keys(dados).length) throw criarErro(400, "Informe os dados do registro.");
    const valores = {};
    if (catalogo) {
        if (!parcial || Object.hasOwn(dados, "nome")) valores.nome = texto(dados.nome, "nome", tipo === "fornecedores" ? 150 : 100);
        if (tipo === "fornecedores" && (!parcial || Object.hasOwn(dados, "contato"))) {
            valores.contato = dados.contato === undefined ? null : texto(dados.contato, "contato", 150, true);
        }
        return valores;
    }
    for (const campo of ["descricao", custo ? "dataCusto" : "dataReceita", custo ? "codTipoCusto" : "codTipoReceita"]) {
        if (!parcial || Object.hasOwn(dados, campo)) valores[campo] = campo === "descricao" ? texto(dados[campo], campo, 255)
            : campo.startsWith("data") ? dataCivil(dados[campo], campo) : codigo(dados[campo], campo);
    }
    if (Object.hasOwn(dados, "valor")) valores.valor = decimal(dados.valor, "valor", 10);
    else if (!parcial && (custo || !dados.codFechamento)) throw criarErro(400, "Informe o valor do lançamento.");
    const opcional = custo ? "codFornecedor" : "codFechamento";
    if (!parcial || Object.hasOwn(dados, opcional)) valores[opcional] = dados[opcional] == null ? null : codigo(dados[opcional], opcional);
    return valores;
}

// Conferir se os registros vinculados à operação existem
async function validarReferencias(tipo, valores, tx) {
    const custo = tipo === "custos";
    const campoTipo = custo ? "codTipoCusto" : "codTipoReceita";
    if (!await repository.buscar(custo ? "tiposCusto" : "tiposReceita", valores[campoTipo], tx)) throw criarErro(400, "O tipo informado não existe.");
    if (custo && valores.codFornecedor != null && !await repository.buscar("fornecedores", valores.codFornecedor, tx)) throw criarErro(400, "O fornecedor não existe.");
}

// Conferir o fechamento e usar seu valor na receita vinculada ao leite
async function valorDoFechamento(valores, tx) {
    if (valores.codFechamento == null) return;
    const fechamento = await leiteRepository.buscarFechamento(valores.codFechamento, tx);
    if (!fechamento) throw criarErro(400, "Fechamento não encontrado.");
    if (fechamento.valorTotalLeite == null) throw criarErro(400, "Informe o valor total do leite no fechamento antes de gerar a receita.");
    const valor = decimal(fechamento.valorTotalLeite, "valor da receita do leite", 10);
    if (valores.valor !== undefined && valores.valor !== valor) throw criarErro(400, "A receita do leite deve ter o mesmo valor do fechamento.");
    valores.valor = valor;
}

// Validar os dados e cadastrar o registro
async function criar(tipo, dados) {
    const valores = validarDados(tipo, dados);
    try {
        return await repository.executarEmTransacao(async tx => {
            if (!CATALOGOS.includes(tipo)) {

                if (tipo === "receitas") await valorDoFechamento(valores, tx);
                await validarReferencias(tipo, valores, tx);
            }
            return repository.criar(tipo, valores, tx);
        });
    } catch (erro) { throw tratarErro(erro); }
}

// Validar as alterações e atualizar o registro
async function atualizar(tipo, id, dados) {
    const chave = codigo(id, "codigo");
    const valores = validarDados(tipo, dados, true);
    try {
        return await repository.executarEmTransacao(async tx => {
            if (tipo === "receitas") {
                const anterior = await repository.buscar(tipo, chave, tx, false);
                if (!anterior) throw criarErro(404, "Registro financeiro não encontrado.");
                await valorDoFechamento({ ...anterior.get({ plain: true }), ...valores }, tx);
            }
            const registro = await repository.buscar(tipo, chave, tx);
            if (!registro) throw criarErro(404, "Registro financeiro não encontrado.");
            if (!CATALOGOS.includes(tipo)) {
                const completo = { ...registro.get({ plain: true }), ...valores };
                if (tipo === "receitas") {
                    await valorDoFechamento(completo, tx);
                    if (completo.codFechamento != null) valores.valor = completo.valor;
                }
                await validarReferencias(tipo, completo, tx);
            }
            return repository.atualizar(registro, valores, tx);
        });
    } catch (erro) { throw tratarErro(erro); }
}

// Excluir o registro respeitando os vínculos existentes
async function deletar(tipo, id) {
    const chave = codigo(id, "codigo");
    try {
        return await repository.executarEmTransacao(async tx => {
            if (tipo === "receitas") {
                const anterior = await repository.buscar(tipo, chave, tx, false);
                if (!anterior) throw criarErro(404, "Registro financeiro não encontrado.");
                if (anterior.codFechamento) await leiteRepository.buscarFechamento(anterior.codFechamento, tx);
            }
            const registro = await repository.buscar(tipo, chave, tx);
            if (!registro) throw criarErro(404, "Registro financeiro não encontrado.");
            await repository.deletar(registro, tx);
        });
    } catch (erro) { throw tratarErro(erro); }
}

// Buscar o registro pelo código e conferir se ele existe
async function buscarPorCod(tipo, id) {
    const registro = await repository.detalhes(tipo, codigo(id, "codigo"));
    if (!registro) throw criarErro(404, "Registro financeiro não encontrado.");
    return registro;
}

// Listar os registros com os filtros validados
async function listar(tipo, filtros = {}) {
    const catalogo = CATALOGOS.includes(tipo);
    const extras = tipo === "custos" ? ["codTipoCusto", "codFornecedor"] : ["codTipoReceita", "codFechamento"];
    objeto(filtros, catalogo ? ["busca"] : ["mes", "ano", "de", "ate", ...extras]);
    if (catalogo) return repository.listar(tipo, Object.hasOwn(filtros, "busca") ? { busca: texto(filtros.busca, "busca", 150, true) } : {});
    const valores = {};
    if (["mes", "ano", "de", "ate"].some(campo => Object.hasOwn(filtros, campo))) {
        const periodo = intervalo(filtros); valores.de = periodo.de; valores.ate = periodo.ate;
    }
    for (const campo of extras) if (Object.hasOwn(filtros, campo)) valores[campo] = codigo(filtros[campo], campo);
    return repository.listar(tipo, valores);
}

// Criar ou atualizar a receita única vinculada ao fechamento do leite
async function registrarReceitaDoLeite(dados, fechamento, tx) {
    const valores = validarDados("receitas", { ...dados, codFechamento: fechamento.codFechamento });
    await valorDoFechamento(valores, tx);
    await validarReferencias("receitas", valores, tx);
    const existente = await repository.receitaDoFechamento(fechamento.codFechamento, tx);
    return existente ? repository.atualizar(existente, valores, tx) : repository.criar("receitas", valores, tx);
}

// Somar custos e receitas por mês e tipo, calculando o saldo
function montarResumo(periodo, registros) {
    const grupos = { custos: new Map(), receitas: new Map() }, meses = new Map();
    const inicio = new Date(`${periodo.de.slice(0, 7)}-01T00:00:00Z`);
    const limite = periodo.ate.slice(0, 7);
    while (inicio.toISOString().slice(0, 7) <= limite) {
        const mes = inicio.toISOString().slice(0, 7);
        meses.set(mes, { referencia: mes, custos: 0n, receitas: 0n });
        inicio.setUTCMonth(inicio.getUTCMonth() + 1);
        if (inicio.getUTCFullYear() > 9999) break;
    }
    const totais = { custos: 0n, receitas: 0n };
    for (const tipo of ["custos", "receitas"]) {
        const data = tipo === "custos" ? "dataCusto" : "dataReceita";
        const campoTipo = tipo === "custos" ? "tipoCusto" : "tipoReceita";
        for (const registro of registros[tipo]) {
            const valor = centavos(registro.valor), id = registro[tipo === "custos" ? "codTipoCusto" : "codTipoReceita"];
            totais[tipo] += valor;
            meses.get(registro[data].slice(0, 7))[tipo] += valor;
            const grupo = grupos[tipo].get(id) || { codigo: id, nome: registro[campoTipo]?.nome || "Tipo não informado", valor: 0n };
            grupo.valor += valor; grupos[tipo].set(id, grupo);
        }
    }
    return { periodo, totalCustos: formatar(totais.custos), totalReceitas: formatar(totais.receitas), saldo: formatar(totais.receitas - totais.custos),
        porMes: [...meses.values()].map(m => ({ referencia: m.referencia, custos: formatar(m.custos), receitas: formatar(m.receitas), saldo: formatar(m.receitas - m.custos) })),
        custosPorTipo: [...grupos.custos.values()].map(g => ({ ...g, valor: formatar(g.valor) })),
        receitasPorTipo: [...grupos.receitas.values()].map(g => ({ ...g, valor: formatar(g.valor) })) };
}

// Consultar os lançamentos e montar o resumo financeiro do período
async function resumo(filtros = {}) {
    objeto(filtros, ["mes", "ano", "de", "ate"]);
    const periodo = intervalo(filtros);
    try { return await repository.executarEmTransacao(async tx => montarResumo(periodo, await repository.dadosResumo(periodo, tx))); }
    catch (erro) { throw tratarErro(erro); }
}

module.exports = { criar, atualizar, deletar, listar, buscarPorCod, resumo, registrarReceitaDoLeite, montarResumo };
