const { Op, Transaction } = require("sequelize");
const { sequelize, Fornecedor, TipoCusto, TipoReceita, Custo, Receita, FechamentoMensal, DocumentoCusto, DocumentoReceita, Documento } = require("../database/models");
const MODELS = { fornecedores: Fornecedor, tiposCusto: TipoCusto, tiposReceita: TipoReceita, custos: Custo, receitas: Receita };
const CHAVES = { fornecedores: "codFornecedor", tiposCusto: "codTipoCusto", tiposReceita: "codTipoReceita", custos: "codCusto", receitas: "codReceita" };

// Executar as alterações em conjunto e desfazer tudo se houver uma falha
function executarEmTransacao(operacao) {
    return sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE }, operacao);
}
// Definir os relacionamentos carregados nas consultas
function relacoes(tipo) {
    const documento = { model: Documento, as: "documento", attributes: ["codDocumento", "nomeArquivo", "tipoDocumento", "dataHoraInclusao"] };
    if (tipo === "custos") return [{ model: TipoCusto, as: "tipoCusto" }, { model: Fornecedor, as: "fornecedor" },
        { model: DocumentoCusto, as: "documentosCusto", include: [documento] }];
    if (tipo === "receitas") return [{ model: TipoReceita, as: "tipoReceita" }, { model: FechamentoMensal, as: "fechamento" },
        { model: DocumentoReceita, as: "documentosReceita", include: [documento] }];
    return [];
}
// Buscar o registro pelo código informado
function buscar(tipo, id, tx, bloquear = true) {
    return MODELS[tipo].findByPk(id, { transaction: tx, lock: tx && bloquear ? tx.LOCK.UPDATE : undefined });
}
// Buscar o registro com seus relacionamentos
function detalhes(tipo, id, tx) { return MODELS[tipo].findByPk(id, { transaction: tx, include: relacoes(tipo) }); }
// Inserir o registro no banco
function criar(tipo, dados, tx) { return MODELS[tipo].create(dados, { transaction: tx }); }
// Atualizar o registro no banco
function atualizar(registro, dados, tx) { return registro.update(dados, { transaction: tx }); }
// Excluir o registro do banco
function deletar(registro, tx) { return registro.destroy({ transaction: tx }); }
// Buscar a receita vinculada ao fechamento mensal do leite
function receitaDoFechamento(codFechamento, tx) { return Receita.findOne({ where: { codFechamento }, transaction: tx }); }

// Consultar os registros no banco
function listar(tipo, filtros) {
    const { busca, de, ate, ...where } = filtros;
    if (busca) where.nome = { [Op.iLike]: `%${busca.replace(/[\\%_]/g, "\\$&")}%` };
    if (de || ate) where[tipo === "custos" ? "dataCusto" : "dataReceita"] = { ...(de ? { [Op.gte]: de } : {}), ...(ate ? { [Op.lte]: ate } : {}) };
    const ordem = ["custos", "receitas"].includes(tipo) ? [[CHAVES[tipo], "DESC"]] : [["nome", "ASC"], [CHAVES[tipo], "ASC"]];
    return MODELS[tipo].findAll({ where, include: relacoes(tipo), order: ordem });
}

// Consultar custos e receitas do período para montar o resumo financeiro
async function dadosResumo(periodo, tx) {
    const [custos, receitas] = await Promise.all([
        Custo.findAll({ where: { dataCusto: { [Op.between]: [periodo.de, periodo.ate] } },
            attributes: ["dataCusto", "valor", "codTipoCusto"], include: [{ model: TipoCusto, as: "tipoCusto" }], transaction: tx }),
        Receita.findAll({ where: { dataReceita: { [Op.between]: [periodo.de, periodo.ate] } },
            attributes: ["dataReceita", "valor", "codTipoReceita"], include: [{ model: TipoReceita, as: "tipoReceita" }], transaction: tx }),
    ]);
    return { custos, receitas };
}

module.exports = { executarEmTransacao, buscar, detalhes, criar, atualizar, deletar, listar, receitaDoFechamento, dadosResumo };
