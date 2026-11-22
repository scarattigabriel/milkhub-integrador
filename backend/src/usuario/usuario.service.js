const bcrypt = require("bcryptjs");
const {
    UniqueConstraintError,
    ValidationError,
    ForeignKeyConstraintError,
} = require("sequelize");
const usuarioRepository = require("./usuario.repository");
const { objeto, texto } = require("../utils/validacao");
const { inteiro } = require("../utils/periodo");

const CAMPOS_PERMITIDOS = ["nome", "login", "senha", "ativo", "perfil"];
const CUSTO_HASH = 12;

// Criar um erro com mensagem e status HTTP para interromper a operação
function criarErro(status, mensagem) {
    const erro = new Error(mensagem);
    erro.status = status;
    return erro;
}

// Conferir se o código é um inteiro positivo válido
function validarCodigo(codUsuario) {
    if (
        !["string", "number"].includes(typeof codUsuario) ||
        !/^[1-9]\d*$/.test(String(codUsuario)) ||
        Number(codUsuario) > 2147483647
    ) {
        throw criarErro(400, "O código do usuário deve ser um inteiro positivo válido.");
    }
    return Number(codUsuario);
}

// Conferir o formato e o tamanho do login
function validarLogin(login) {
    if (typeof login !== "string" || login.trim() === "") {
        throw criarErro(400, "Informe o login.");
    }

    const loginValidado = login.trim();
    if (loginValidado.length > 60) {
        throw criarErro(400, "O login deve ter no máximo 60 caracteres.");
    }
    if (!/^[a-zA-Z0-9._-]+$/.test(loginValidado)) {
        throw criarErro(400, "O login deve conter apenas letras, números, pontos, traços e underscores.");
    }
    return loginValidado;
}

// Conferir e normalizar os campos enviados para a operação
function validarDados(dados, atualizacao = false) {
    if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
        throw criarErro(400, "Informe os dados do usuário em um objeto JSON.");
    }

    const campos = Object.keys(dados);
    if (campos.some(campo => !CAMPOS_PERMITIDOS.includes(campo))) {
        throw criarErro(400, "Informe somente nome, login, senha, ativo e perfil.");
    }
    if (atualizacao && campos.length === 0) {
        throw criarErro(400, "Informe ao menos um campo para atualização.");
    }

    const valores = { ...dados };
    if (!atualizacao && valores.ativo === undefined) {
        valores.ativo = true;
    }

    if (!atualizacao || Object.hasOwn(dados, "nome")) {
        if (typeof valores.nome !== "string" || valores.nome.trim() === "") {
            throw criarErro(400, "Informe o nome do usuário.");
        }
        valores.nome = valores.nome.trim();
        if (valores.nome.length > 150) {
            throw criarErro(400, "O nome deve ter no máximo 150 caracteres.");
        }
        if (!/^[\p{L}\p{M}]+(?:[ '\u2019-]+[\p{L}\p{M}]+)*$/u.test(valores.nome)) {
            throw criarErro(400, "O nome deve conter letras, espaços, apóstrofos ou hífens.");
        }
    }

    if (!atualizacao || Object.hasOwn(dados, "login")) {
        valores.login = validarLogin(valores.login);
    }

    if (!atualizacao || Object.hasOwn(dados, "senha")) {
        if (typeof valores.senha !== "string" || valores.senha.trim() === "") {
            throw criarErro(400, "Informe a senha.");
        }
        if (valores.senha.length < 8) {
            throw criarErro(400, "A senha deve ter pelo menos 8 caracteres.");
        }
        if (Buffer.byteLength(valores.senha, "utf8") > 72) {
            throw criarErro(400, "A senha deve ter no máximo 72 bytes.");
        }
    }

    if (!atualizacao || Object.hasOwn(dados, "ativo")) {
        if (typeof valores.ativo !== "boolean") {
            throw criarErro(400, "Ativo deve ser true ou false.");
        }
    }

    if (!atualizacao || Object.hasOwn(dados, "perfil")) {
        if (!["GESTOR", "COLABORADOR"].includes(valores.perfil)) {
            throw criarErro(400, "O perfil deve ser GESTOR ou COLABORADOR.");
        }
    }
    return valores;
}

// Selecionar os campos do usuário que podem ser enviados ao frontend
function dadosPublicos(usuario) {
    return {
        codUsuario: usuario.codUsuario,
        nome: usuario.nome,
        login: usuario.login,
        ativo: usuario.ativo,
        perfil: usuario.perfil,
    };
}

// Converter duplicidades e conflitos de gravação de usuários em erros conhecidos
function tratarErroGravacao(erro) {
    if (["40001", "40P01"].includes(erro.original?.code)) return criarErro(409, "Houve uma alteração simultânea de usuários. Consulte e tente novamente.");
    if (erro instanceof UniqueConstraintError) {
        return criarErro(409, "Este login já está cadastrado.");
    }
    if (erro instanceof ValidationError) {
        return criarErro(400, "Os dados informados são inválidos para o cadastro de usuário.");
    }
    return erro;
}

// Validar o login e buscar os dados públicos do usuário
async function buscarPorLogin(login) {
    const usuario = await usuarioRepository.buscarPorLogin(validarLogin(login));
    // Retornar null quando o login não está cadastrado
    return usuario ? dadosPublicos(usuario) : null;
}

// Buscar o registro pelo código e conferir se ele existe
async function buscarPorCod(codUsuario) {
    const usuario = await usuarioRepository.buscarPorCod(validarCodigo(codUsuario));
    if (!usuario) {
        throw criarErro(404, "Usuário não encontrado.");
    }
    return dadosPublicos(usuario);
}

// Validar os dados e cadastrar o registro
async function criar(dados) {
    const valores = validarDados(dados);
    const existente = await usuarioRepository.buscarPorLogin(valores.login);
    if (existente) {
        throw criarErro(409, "Este login já está cadastrado.");
    }

    valores.senha = await bcrypt.hash(valores.senha, CUSTO_HASH);
    try {
        const usuario = await usuarioRepository.criar(valores);
        return dadosPublicos(usuario);
    } catch (erro) {

        throw tratarErroGravacao(erro);
    }
}

// Validar as alterações e atualizar o registro
async function atualizar(codUsuario, dados) {
    const codigo = validarCodigo(codUsuario);
    const valores = validarDados(dados, true);
    if (Object.hasOwn(valores, "senha")) {
        valores.senha = await bcrypt.hash(valores.senha, CUSTO_HASH);
    }

    try {
        return await usuarioRepository.executarEmTransacao(async tx => {
            const gestores = await usuarioRepository.bloquearGestoresAtivos(tx);
            const atual = await usuarioRepository.buscarPorCod(codigo, tx);
            if (!atual) throw criarErro(404, "Usuário não encontrado.");
            preservarGestor(atual, { perfil: valores.perfil ?? atual.perfil, ativo: valores.ativo ?? atual.ativo }, gestores);
            if (Object.hasOwn(valores, "login")) {
                const existente = await usuarioRepository.buscarPorLogin(valores.login, tx);
                if (existente && Number(existente.codUsuario) !== codigo) throw criarErro(409, "Este login já está cadastrado.");
            }
            const usuario = await usuarioRepository.atualizar(codigo, valores, tx);
            if (!usuario) throw criarErro(404, "Usuário não encontrado.");
            return dadosPublicos(usuario);
        });
    } catch (erro) {
        throw tratarErroGravacao(erro);
    }
}

// Excluir o registro respeitando os vínculos existentes
async function deletar(codUsuario) {
    const codigo = validarCodigo(codUsuario);
    try {
        return await usuarioRepository.executarEmTransacao(async tx => {
            const gestores = await usuarioRepository.bloquearGestoresAtivos(tx);
            const atual = await usuarioRepository.buscarPorCod(codigo, tx);
            if (!atual) throw criarErro(404, "Usuário não encontrado.");
            preservarGestor(atual, { perfil: atual.perfil, ativo: false }, gestores);
            const usuario = await usuarioRepository.deletar(codigo, tx);
            if (!usuario) throw criarErro(404, "Usuário não encontrado.");
            return dadosPublicos(usuario);
        });
    } catch (erro) {
        if (erro instanceof ForeignKeyConstraintError) {
            throw criarErro(409, "O usuário possui registros vinculados e não pode ser excluído.");
        }
        throw tratarErroGravacao(erro);
    }
}

// Impedir desativar, excluir ou rebaixar o último gestor ativo
function preservarGestor(atual, proximo, gestores) {
    if (atual.perfil === "GESTOR" && atual.ativo && (proximo.perfil !== "GESTOR" || !proximo.ativo) && gestores.length <= 1) {
        throw criarErro(409, "Mantenha ao menos um gestor ativo. Cadastre ou promova outro gestor antes dessa alteração.");
    }
}

// Listar os registros com os filtros validados
async function listar(filtros = {}) {
    objeto(filtros, ["busca", "perfil", "ativo", "pagina", "limite"]);
    const valores = { pagina: filtros.pagina === undefined ? 1 : inteiro(filtros.pagina, "pagina", 1, 2147483647),
        limite: filtros.limite === undefined ? 20 : inteiro(filtros.limite, "limite", 1, 100) };
    if (Object.hasOwn(filtros, "busca")) valores.busca = texto(filtros.busca, "busca", 150, true);
    if (Object.hasOwn(filtros, "perfil")) {
        if (!["GESTOR", "COLABORADOR"].includes(filtros.perfil)) throw criarErro(400, "Perfil inválido.");
        valores.perfil = filtros.perfil;
    }
    if (Object.hasOwn(filtros, "ativo")) {
        if (!["true", "false"].includes(filtros.ativo)) throw criarErro(400, "ativo deve ser true ou false.");
        valores.ativo = filtros.ativo === "true";
    }
    const { rows, count } = await usuarioRepository.listar(valores);
    return { usuarios: rows.map(dadosPublicos), paginacao: { pagina: valores.pagina, limite: valores.limite, total: count, paginas: Math.ceil(count / valores.limite) } };
}

module.exports = { listar, buscarPorLogin, buscarPorCod, criar, atualizar, deletar };
