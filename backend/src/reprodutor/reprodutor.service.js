const { UniqueConstraintError, ForeignKeyConstraintError, ValidationError } = require("sequelize");
const repository = require("./reprodutor.repository");
const { criarErro, objeto, codigo, texto } = require("../utils/validacao");

// Conferir e normalizar os dados do cadastro
function validar(dados, parcial = false) {
    objeto(dados, ["nome", "numeroRegistro", "codRaca"]);
    if (!Object.keys(dados).length) throw criarErro(400, "Informe os dados do reprodutor.");
    const valores = {};
    if (!parcial || Object.hasOwn(dados, "nome")) valores.nome = texto(dados.nome, "nome", 150);
    if (Object.hasOwn(dados, "numeroRegistro")) valores.numeroRegistro = texto(dados.numeroRegistro, "numeroRegistro", 60, true);
    else if (!parcial) valores.numeroRegistro = null;
    if (Object.hasOwn(dados, "codRaca")) valores.codRaca = dados.codRaca === null ? null : codigo(dados.codRaca, "codRaca");
    else if (!parcial) valores.codRaca = null;
    return valores;
}

// Converter falhas conhecidas em erros adequados para a operação
function tratarErro(erro) {
    if (erro instanceof UniqueConstraintError) return criarErro(409, "O número de registro já pertence a outro reprodutor.");
    if (erro instanceof ForeignKeyConstraintError) return criarErro(409, "O reprodutor possui inseminações vinculadas ou a raça foi alterada. Consulte os vínculos.");
    if (erro instanceof ValidationError) return criarErro(400, "Os dados do reprodutor são inválidos.");
    return erro;
}

// Conferir se a raça informada existe
async function validarRaca(valores) {
    if (valores.codRaca != null && !await repository.buscarRaca(valores.codRaca)) throw criarErro(400, "A raça informada não existe.");
}

// Listar os registros com os filtros validados
async function listar(filtros = {}) {
    objeto(filtros, ["busca", "codRaca"]);
    const valores = {};
    if (Object.hasOwn(filtros, "busca")) valores.busca = texto(filtros.busca, "busca", 150, true);
    if (Object.hasOwn(filtros, "codRaca")) valores.codRaca = codigo(filtros.codRaca, "codRaca");
    return repository.listar(valores);
}

// Buscar o registro pelo código e conferir se ele existe
async function buscarPorCod(id) {
    const reprodutor = await repository.buscarPorCod(codigo(id, "codReprodutor"));
    if (!reprodutor) throw criarErro(404, "Reprodutor não encontrado.");
    return reprodutor;
}

// Validar os dados e cadastrar o registro
async function criar(dados) {
    const valores = validar(dados);
    await validarRaca(valores);
    try { return await repository.criar(valores); } catch (erro) { throw tratarErro(erro); }
}

// Validar as alterações e atualizar o registro
async function atualizar(id, dados) {
    const codReprodutor = codigo(id, "codReprodutor");
    const valores = validar(dados, true);
    await validarRaca(valores);
    try {
        const reprodutor = await repository.atualizar(codReprodutor, valores);
        if (!reprodutor) throw criarErro(404, "Reprodutor não encontrado.");
        return reprodutor;
    } catch (erro) { throw tratarErro(erro); }
}

// Excluir o registro respeitando os vínculos existentes
async function deletar(id) {
    const codReprodutor = codigo(id, "codReprodutor");
    try {
        const reprodutor = await repository.deletar(codReprodutor);
        if (!reprodutor) throw criarErro(404, "Reprodutor não encontrado.");
        return reprodutor;
    } catch (erro) { throw tratarErro(erro); }
}

module.exports = { listar, buscarPorCod, criar, atualizar, deletar };
