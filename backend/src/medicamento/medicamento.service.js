const { ForeignKeyConstraintError, ValidationError } = require("sequelize");
const medicamentoRepository = require("./medicamento.repository");

// Criar um erro com mensagem e status HTTP para interromper a operação
function criarErro(status, mensagem) {
    const erro = new Error(mensagem);
    erro.status = status;
    return erro;
}

// Conferir se o código é um inteiro positivo válido
function validarCodigo(codMedicamento) {
    if (
        !["string", "number"].includes(typeof codMedicamento) ||
        !/^[1-9]\d*$/.test(String(codMedicamento)) ||
        Number(codMedicamento) > 2147483647
    ) {
        throw criarErro(400, "O código do medicamento deve ser um inteiro positivo válido.");
    }
    return Number(codMedicamento);
}

// Conferir e normalizar os campos enviados para a operação
function validarDados(dados, parcial = false) {
    if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
        throw criarErro(400, "Informe os dados do medicamento em um objeto JSON.");
    }
    const campos = Object.keys(dados);
    if (!campos.length || campos.some(campo => !["nome", "descricao"].includes(campo))) {
        throw criarErro(400, "Informe somente nome e descrição. O código é gerado pelo banco.");
    }

    const valores = {};
    if (!parcial || Object.hasOwn(dados, "nome")) {
        if (typeof dados.nome !== "string" || dados.nome.trim() === "") {
            throw criarErro(400, "Informe o nome do medicamento.");
        }
        valores.nome = dados.nome.trim();
        if (valores.nome.length > 150) {
            throw criarErro(400, "O nome do medicamento deve ter no máximo 150 caracteres.");
        }
    }
    if (Object.hasOwn(dados, "descricao")) {
        if (dados.descricao !== null && typeof dados.descricao !== "string") {
            throw criarErro(400, "A descrição deve ser um texto ou null.");
        }
        valores.descricao = dados.descricao === null ? null : dados.descricao.trim() || null;
    } else if (!parcial) {
        valores.descricao = null;
    }
    return valores;
}

// Converter falhas conhecidas em erros adequados para a operação
function tratarErro(erro) {
    if (erro instanceof ForeignKeyConstraintError) {
        return criarErro(409, "O medicamento está vinculado a usos registrados e não pode ser excluído.");
    }
    if (erro instanceof ValidationError) {
        return criarErro(400, "Os dados do medicamento são inválidos.");
    }
    return erro;
}

// Listar os registros com os filtros validados
async function listar(filtros = {}) {
    if (!filtros || typeof filtros !== "object" || Array.isArray(filtros)
        || Object.keys(filtros).some(campo => campo !== "busca")) {
        throw criarErro(400, "Filtros de consulta inválidos.");
    }
    const valores = {};
    if (Object.hasOwn(filtros, "busca")) {
        if (typeof filtros.busca !== "string" || filtros.busca.trim().length > 150) {
            throw criarErro(400, "A busca deve ser um texto de até 150 caracteres.");
        }
        if (filtros.busca.trim()) valores.busca = filtros.busca.trim();
    }
    return medicamentoRepository.listar(valores);
}

// Buscar o registro pelo código e conferir se ele existe
async function buscarPorCod(codMedicamento) {
    const medicamento = await medicamentoRepository.buscarPorCod(validarCodigo(codMedicamento));
    if (!medicamento) throw criarErro(404, "Medicamento não encontrado.");
    return medicamento;
}

// Validar os dados e cadastrar o registro
async function criar(dados) {
    const valores = validarDados(dados);
    try {
        return await medicamentoRepository.criar(valores);
    } catch (erro) {
        throw tratarErro(erro);
    }
}

// Validar as alterações e atualizar o registro
async function atualizar(codMedicamento, dados) {
    const codigo = validarCodigo(codMedicamento);
    const valores = validarDados(dados, true);
    try {
        const medicamento = await medicamentoRepository.atualizar(codigo, valores);
        if (!medicamento) throw criarErro(404, "Medicamento não encontrado.");
        return medicamento;
    } catch (erro) {
        throw tratarErro(erro);
    }
}

// Excluir o registro respeitando os vínculos existentes
async function deletar(codMedicamento) {
    const codigo = validarCodigo(codMedicamento);
    try {
        const medicamento = await medicamentoRepository.deletar(codigo);
        if (!medicamento) throw criarErro(404, "Medicamento não encontrado.");
        return medicamento;
    } catch (erro) {
        throw tratarErro(erro);
    }
}

module.exports = { listar, buscarPorCod, criar, atualizar, deletar };
