const path = require("node:path");
const repository = require("./documento.repository");
const leiteRepository = require("../leite/leite.repository");
const leiteService = require("../leite/leite.service");
const financeiroRepository = require("../financeiro/financeiro.repository");
const financeiroService = require("../financeiro/financeiro.service");
const { criarErro, objeto, codigo, texto } = require("../utils/validacao");
const tratarErro = require("../utils/erro-persistencia");

// Selecionar os dados do documento que podem aparecer na resposta
function metadados(documento) {
    return { codDocumento: documento.codDocumento, tipoDocumento: documento.tipoDocumento, nomeArquivo: documento.nomeArquivo,
        descricao: documento.descricao, dataHoraInclusao: documento.dataHoraInclusao, codFechamento: documento.codFechamento,
        download: `/documentos/${documento.codDocumento}/arquivo` };
}
// Conferir se o perfil pode consultar o documento solicitado
function podeLer(documento, perfil) {
    return perfil === "GESTOR" || (perfil === "COLABORADOR" && documento.codFechamento != null && !documento.custos?.length && !documento.receitas?.length);
}
// Buscar o documento e conferir a permissão de leitura
async function obter(id, perfil, tx) {
    const documento = await repository.buscar(codigo(id, "codDocumento"), tx);
    if (!documento) throw criarErro(404, "Documento não encontrado.");
    if (!podeLer(documento, perfil)) throw criarErro(403, "Seu perfil não tem acesso a este documento.");
    return documento;
}
// Remover o arquivo criado quando a gravação do documento falha
async function limparArquivo(referencia) {
    if (!referencia) return;
    try { await repository.excluirArquivo(referencia); }
    catch (erro) { console.error("Falha ao limpar arquivo de documento:", erro.code || erro.name); }
}

// Conferir o tipo, o conteúdo e o tamanho do arquivo enviado
function validarArquivo(buffer, mime, nome) {
    const tipo = typeof mime === "string" ? mime.split(";")[0].trim().toLowerCase() : "";
    if (!["application/pdf", "image/png", "image/jpeg"].includes(tipo)) throw criarErro(415, "Envie PDF, PNG ou JPEG com Content-Type compatível.");
    if (!Buffer.isBuffer(buffer) || !buffer.length) throw criarErro(400, "Envie um arquivo como corpo binário.");
    if (buffer.length > 10 * 1024 * 1024) throw criarErro(413, "O arquivo excede o limite de 10 MiB.");
    const formatos = { "application/pdf": ["pdf", buffer.subarray(0, 5).toString() === "%PDF-"],
        "image/png": ["png", buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))],
        "image/jpeg": ["jpg", buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255] };
    const formato = formatos[tipo];
    if (!formato[1]) throw criarErro(415, "Envie PDF, PNG ou JPEG com conteúdo e Content-Type compatíveis.");
    const arquivo = texto(nome, "nomeArquivo", 255);
    const extensao = path.extname(arquivo).toLowerCase();
    if (/[\/\\\x00-\x1f\x7f]/.test(arquivo) || !(formato[0] === "jpg" ? [".jpg", ".jpeg"] : [`.${formato[0]}`]).includes(extensao)) {
        throw criarErro(400, "nomeArquivo deve ter extensão compatível e não pode conter caminhos ou controles.");
    }
    return { nomeArquivo: arquivo, extensao: formato[0] };
}

// Validar o arquivo e registrar o documento com seus vínculos
async function anexar(dados, buffer, mime) {
    objeto(dados, ["nomeArquivo", "tipoDocumento", "descricao", "codFechamento", "codCusto", "codReceita",
        "valorTotalLeite", "codTipoReceita", "dataReceita", "descricaoReceita"]);
    const arquivo = validarArquivo(buffer, mime, dados.nomeArquivo);
    const tipo = texto(dados.tipoDocumento, "tipoDocumento", 50);
    if (!["CONTRANOTA", "RELATORIO_QUALIDADE", "NOTA_FISCAL", "COMPROVANTE", "OUTRO"].includes(tipo)) throw criarErro(400, "Tipo de documento inválido.");
    const campos = ["codFechamento", "codCusto", "codReceita"].filter(campo => Object.hasOwn(dados, campo));
    if (campos.length !== 1) throw criarErro(400, "Vincule o documento a exatamente um fechamento, custo ou receita.");
    const campo = campos[0], id = codigo(dados[campo], campo);
    const descricao = dados.descricao === undefined ? null : texto(dados.descricao, "descricao", 255, true);
    const contabilizar = ["codTipoReceita", "dataReceita", "descricaoReceita"].some(c => Object.hasOwn(dados, c));
    if ((contabilizar || Object.hasOwn(dados, "valorTotalLeite")) && (campo !== "codFechamento" || tipo !== "CONTRANOTA")) throw criarErro(400, "Valores do leite só podem ser informados ao anexar contranota a um fechamento.");
    let referencia;
    try {
        return await financeiroRepository.executarEmTransacao(async tx => {
            const alvo = campo === "codFechamento" ? await leiteRepository.buscarFechamento(id, tx) : await financeiroRepository.buscar(campo === "codCusto" ? "custos" : "receitas", id, tx);
            if (!alvo) throw criarErro(404, "Registro de destino não encontrado.");
            if (Object.hasOwn(dados, "valorTotalLeite")) await leiteService.atualizarFechamentoNaTransacao(alvo, { valorTotalLeite: dados.valorTotalLeite }, tx);
            let receita = null;
            if (contabilizar) receita = await financeiroService.registrarReceitaDoLeite({ codTipoReceita: dados.codTipoReceita,
                dataReceita: dados.dataReceita, descricao: dados.descricaoReceita ?? `Leite ${String(alvo.mesReferencia).padStart(2, "0")}/${alvo.anoReferencia}` }, alvo, tx);
            referencia = await repository.salvarArquivo(buffer, arquivo.extensao);
            const documento = await repository.criar({ nomeArquivo: arquivo.nomeArquivo, tipoDocumento: tipo, descricao,
                referenciaArquivo: referencia, codFechamento: campo === "codFechamento" ? id : null }, tx);
            if (campo === "codCusto") await repository.vincularCusto(documento.codDocumento, id, tx);
            if (campo === "codReceita") await repository.vincularReceita(documento.codDocumento, id, tx);
            return { ...metadados(documento), ...(receita ? { receita } : {}) };
        });
    } catch (erro) { await limparArquivo(referencia); throw tratarErro(erro); }
}

// Validar e salvar os índices de qualidade do fechamento mensal
async function registrarQualidade(id, dados) {
    const codFechamento = codigo(id, "codFechamento");
    objeto(dados, ["indices"]);
    if (!Array.isArray(dados.indices) || !dados.indices.length || dados.indices.length > 50) throw criarErro(400, "Informe entre 1 e 50 índices de qualidade do relatório.");
    const nomes = new Set();
    const indices = dados.indices.map(indice => {
        objeto(indice, ["nome", "valor", "unidade"]);
        const nome = texto(indice.nome, "nome do índice", 100);
        const valor = texto(typeof indice.valor === "number" && Number.isFinite(indice.valor) ? String(indice.valor) : indice.valor, "valor do índice", 100);
        const unidade = indice.unidade === undefined ? null : texto(indice.unidade, "unidade", 30, true);
        const chave = nome.toLocaleLowerCase("pt-BR");
        if (nomes.has(chave)) throw criarErro(400, "Não repita nomes de índices.");
        nomes.add(chave); return { nome, valor, unidade };
    });
    let referencia, antiga;
    try {
        const resultado = await leiteRepository.executarEmTransacao(async tx => {
            const fechamento = await leiteRepository.buscarFechamento(codFechamento, tx);
            if (!fechamento) throw criarErro(404, "Fechamento não encontrado.");
            const documento = await repository.qualidadeDoFechamento(codFechamento, tx);
            referencia = await repository.salvarArquivo(Buffer.from(JSON.stringify({ indices })), "json");
            const valores = { nomeArquivo: `indices-qualidade-${fechamento.anoReferencia}-${String(fechamento.mesReferencia).padStart(2, "0")}.json`,
                tipoDocumento: "INDICES_QUALIDADE", descricao: "Índices transcritos manualmente do relatório de qualidade", referenciaArquivo: referencia, codFechamento };
            if (documento) { antiga = documento.referenciaArquivo; await repository.atualizar(documento, valores, tx); }
            else await repository.criar(valores, tx);
            return { codFechamento, indices };
        });
        await limparArquivo(antiga); return resultado;
    } catch (erro) { await limparArquivo(referencia); throw tratarErro(erro); }
}

// Listar os registros com os filtros validados
async function listar(filtros = {}, perfil) {
    objeto(filtros, ["codFechamento", "tipoDocumento"]);
    if (perfil !== "GESTOR" && !Object.hasOwn(filtros, "codFechamento")) throw criarErro(403, "Informe um fechamento para consultar documentos do leite.");
    const where = {};
    if (Object.hasOwn(filtros, "codFechamento")) where.codFechamento = codigo(filtros.codFechamento, "codFechamento");
    if (Object.hasOwn(filtros, "tipoDocumento")) where.tipoDocumento = texto(filtros.tipoDocumento, "tipoDocumento", 50);
    const documentos = await repository.listar(where);
    return documentos.filter(d => podeLer(d, perfil)).map(metadados);
}
// Buscar o registro pelo código e conferir se ele existe
async function buscarPorCod(id, perfil) { return metadados(await obter(id, perfil)); }
// Buscar o documento autorizado e devolver seu conteúdo para download
async function baixar(id, perfil) {
    const documento = await obter(id, perfil);
    const buffer = await repository.lerArquivo(documento.referenciaArquivo);
    const extensao = path.extname(documento.referenciaArquivo);
    const mime = { ".pdf": "application/pdf", ".png": "image/png", ".jpg": "image/jpeg", ".json": "application/json" }[extensao];
    return { buffer, nomeArquivo: documento.nomeArquivo, mime };
}
// Excluir o registro respeitando os vínculos existentes
async function deletar(id) {
    const codDocumento = codigo(id, "codDocumento"); let referencia;
    try {
        await financeiroRepository.executarEmTransacao(async tx => {
            const documento = await obter(codDocumento, "GESTOR", tx);
            if (documento.codFechamento) await leiteRepository.buscarFechamento(documento.codFechamento, tx);
            referencia = documento.referenciaArquivo;
            await repository.deletar(documento, tx);
        });
        await limparArquivo(referencia);
    } catch (erro) { throw tratarErro(erro); }
}

module.exports = { anexar, registrarQualidade, listar, buscarPorCod, baixar, deletar };
