const { ForeignKeyConstraintError } = require("sequelize");
const racaRepository = require("./raca.repository");

// Criar um erro com mensagem e status HTTP para interromper a operação
function criarErro(status, mensagem) {
    const erro = new Error(mensagem);
    erro.status = status;
    return erro;
}

// Conferir se o código é um inteiro positivo válido
function validarCodigo(codRaca) {
    if (
        !["string", "number"].includes(typeof codRaca) ||
        !/^[1-9]\d*$/.test(String(codRaca)) ||
        Number(codRaca) > 2147483647
    ) {
        throw criarErro(400, "O código da raça deve ser um inteiro positivo válido.");
    }
    return Number(codRaca);
}

// Conferir e normalizar os campos enviados para a operação
function validarDados(dados) {
    if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
        throw criarErro(400, "Informe os dados da raça em um objeto JSON.");
    }

    if (Object.keys(dados).some(campo => campo !== "nome")) {
        throw criarErro(400, "Informe somente o nome da raça. O código é gerado pelo banco.");
    }

    if (typeof dados.nome !== "string" || dados.nome.trim() === "") {
        throw criarErro(400, "Informe o nome da raça.");
    }

    const nome = dados.nome.trim();
    if (nome.length > 100) {
        throw criarErro(400, "O nome da raça deve ter no máximo 100 caracteres.");
    }

    return { nome };
}

// Listar os registros com os filtros validados
async function listar() {
    return racaRepository.listar();
}

// Buscar o registro pelo código e conferir se ele existe
async function buscarPorCod(codRaca) {
    const raca = await racaRepository.buscarPorCod(validarCodigo(codRaca));
    if (!raca) {
        throw criarErro(404, "Raça não encontrada.");
    }
    return raca;
}

// Validar os dados e cadastrar o registro
async function criar(dados) {
    return racaRepository.criar(validarDados(dados));
}

// Validar as alterações e atualizar o registro
async function atualizar(codRaca, dados) {
    const codigo = validarCodigo(codRaca);
    const valores = validarDados(dados);
    const raca = await racaRepository.atualizar(codigo, valores);
    if (!raca) {
        throw criarErro(404, "Raça não encontrada.");
    }
    return raca;
}

// Excluir o registro respeitando os vínculos existentes
async function deletar(codRaca) {
    const codigo = validarCodigo(codRaca);
    try {
        const raca = await racaRepository.deletar(codigo);
        if (!raca) {
            throw criarErro(404, "Raça não encontrada.");
        }
        return raca;
    } catch (erro) {
        if (erro instanceof ForeignKeyConstraintError) {
            throw criarErro(409, "A raça está vinculada a animais ou reprodutores e não pode ser excluída.");
        }
        throw erro;
    }
}

module.exports = { listar, buscarPorCod, criar, atualizar, deletar };
