const fs = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
const { Documento, DocumentoCusto, DocumentoReceita } = require("../database/models");
const { criarErro } = require("../utils/validacao");

const DIRETORIO = path.resolve(process.env.DOCUMENTOS_DIR || path.join(__dirname, "../../uploads/documentos"));
// Montar o caminho de um arquivo dentro do diretório de documentos
function caminho(referencia) {
    if (typeof referencia !== "string" || !/^[a-f0-9-]{36}\.(pdf|png|jpg|json)$/.test(referencia)) throw criarErro(409, "Referência de arquivo incompatível com o armazenamento local.");
    return path.join(DIRETORIO, referencia);
}
// Gravar o conteúdo do documento no diretório configurado
async function salvarArquivo(buffer, extensao) {
    if (!["pdf", "png", "jpg", "json"].includes(extensao)) throw criarErro(400, "Formato não suportado.");
    await fs.mkdir(DIRETORIO, { recursive: true, mode: 0o700 });
    const referencia = `${randomUUID()}.${extensao}`;
    await fs.writeFile(caminho(referencia), buffer, { flag: "wx", mode: 0o600 });
    return referencia;
}
// Ler o conteúdo de um documento armazenado
async function lerArquivo(referencia) {
    try { return await fs.readFile(caminho(referencia)); }
    catch (erro) { if (erro.code === "ENOENT") throw criarErro(404, "Arquivo não encontrado no armazenamento."); throw erro; }
}
// Remover o arquivo físico do documento
async function excluirArquivo(referencia) {
    try { await fs.unlink(caminho(referencia)); } catch (erro) { if (erro.code !== "ENOENT") throw erro; }
}
// Definir os relacionamentos carregados nas consultas
function relacoes() { return [{ model: DocumentoCusto, as: "custos" }, { model: DocumentoReceita, as: "receitas" }]; }
// Buscar o registro pelo código informado
function buscar(id, tx) { return Documento.findByPk(id, { include: relacoes(), transaction: tx }); }
// Consultar os registros no banco
function listar(where, tx) { return Documento.findAll({ where, include: relacoes(), transaction: tx, order: [["codDocumento", "DESC"]] }); }
// Buscar o documento que armazena os índices de qualidade do fechamento
function qualidadeDoFechamento(codFechamento, tx) {
    return Documento.findOne({ where: { codFechamento, tipoDocumento: "INDICES_QUALIDADE" }, order: [["codDocumento", "DESC"]], transaction: tx });
}
// Inserir o registro no banco
function criar(dados, tx) { return Documento.create(dados, { transaction: tx }); }
// Atualizar o registro no banco
function atualizar(registro, dados, tx) { return registro.update(dados, { transaction: tx }); }
// Excluir o registro do banco
function deletar(registro, tx) { return registro.destroy({ transaction: tx }); }
// Vincular o documento ao lançamento de custo
function vincularCusto(codDocumento, codCusto, tx) { return DocumentoCusto.create({ codDocumento, codCusto }, { transaction: tx }); }
// Vincular o documento ao lançamento de receita
function vincularReceita(codDocumento, codReceita, tx) { return DocumentoReceita.create({ codDocumento, codReceita }, { transaction: tx }); }

module.exports = { salvarArquivo, lerArquivo, excluirArquivo, buscar, listar, qualidadeDoFechamento, criar, atualizar, deletar, vincularCusto, vincularReceita };
