const { Op, Transaction } = require("sequelize");
const { sequelize, ColetaLeite, FechamentoMensal, Documento, DocumentoCusto, DocumentoReceita } = require("../database/models");

// Executar as alterações em conjunto e desfazer tudo se houver uma falha
function executarEmTransacao(operacao) {
    return sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE }, operacao);
}
// Buscar o registro de coleta
function buscarColeta(id, tx) { return ColetaLeite.findByPk(id, { transaction: tx, lock: tx ? tx.LOCK.UPDATE : undefined }); }
// Buscar a coleta com o fechamento mensal vinculado
function detalhesColeta(id, tx) { return ColetaLeite.findByPk(id, { transaction: tx, include: [{ model: FechamentoMensal, as: "fechamento" }] }); }
// Buscar o registro de fechamento
function buscarFechamento(id, tx) { return FechamentoMensal.findByPk(id, { transaction: tx, lock: tx ? tx.LOCK.UPDATE : undefined }); }
// Buscar o fechamento correspondente ao mês e ao ano informados
function fechamentoDoMes(mes, ano, tx) {
    return FechamentoMensal.findOne({ where: { mesReferencia: mes, anoReferencia: ano }, transaction: tx, lock: tx ? tx.LOCK.UPDATE : undefined });
}
// Criar um registro de fechamento
function criarFechamento(dados, tx) { return FechamentoMensal.create(dados, { transaction: tx }); }
// Criar um registro de coleta
function criarColeta(dados, tx) { return ColetaLeite.create(dados, { transaction: tx }); }
// Atualizar o registro no banco
function atualizar(registro, dados, tx) { return registro.update(dados, { transaction: tx }); }
// Excluir o registro de coleta
function deletarColeta(registro, tx) { return registro.destroy({ transaction: tx }); }
// Listar os registros de coleta
function listarColetas(filtros, tx) {
    const { de, ate, codFechamento } = filtros;
    return ColetaLeite.findAll({ where: {
        ...(de || ate ? { dataColeta: { ...(de ? { [Op.gte]: de } : {}), ...(ate ? { [Op.lte]: ate } : {}) } } : {}),
        ...(codFechamento ? { codFechamento } : {}),
    }, transaction: tx, order: [["dataColeta", "ASC"], ["horarioColeta", "ASC"], ["codColeta", "ASC"]] });
}
// Listar os registros de fechamento
function listarFechamentos(filtros) {
    return FechamentoMensal.findAll({ where: filtros, order: [["anoReferencia", "DESC"], ["mesReferencia", "DESC"]] });
}
// Listar os documentos vinculados ao fechamento mensal
async function documentosDoFechamento(codFechamento, tx) {
    const registros = await Documento.findAll({ where: { codFechamento }, attributes: ["codDocumento", "tipoDocumento", "nomeArquivo", "descricao", "dataHoraInclusao"],
        include: [{ model: DocumentoCusto, as: "custos" }, { model: DocumentoReceita, as: "receitas" }],
        transaction: tx, order: [["codDocumento", "DESC"]] });
    return registros.filter(r => !r.custos.length && !r.receitas.length).map(r => ({ codDocumento: r.codDocumento,
        tipoDocumento: r.tipoDocumento, nomeArquivo: r.nomeArquivo, descricao: r.descricao, dataHoraInclusao: r.dataHoraInclusao,
        download: `/documentos/${r.codDocumento}/arquivo` }));
}

module.exports = { executarEmTransacao, buscarColeta, detalhesColeta, buscarFechamento, fechamentoDoMes, criarFechamento,
    criarColeta, atualizar, deletarColeta, listarColetas, listarFechamentos, documentosDoFechamento };
