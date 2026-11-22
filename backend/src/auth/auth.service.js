const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authRepository = require("./auth.repository");
const { obterConfiguracaoToken } = require("../config/jwt");

// Criar um erro com mensagem e status HTTP para interromper a operação
function criarErro(status, mensagem) {
    const erro = new Error(mensagem);
    erro.status = status;
    return erro;
}

// Validar login e senha antes de consultar a conta
function validarCredenciais(dados) {
    if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
        throw criarErro(400, "Informe login e senha em um objeto JSON.");
    }

    if (Object.keys(dados).some(campo => !["login", "senha"].includes(campo))) {
        throw criarErro(400, "Informe somente login e senha.");
    }

    if (typeof dados.login !== "string" || dados.login.trim() === "") {
        throw criarErro(400, "Informe o login.");
    }

    const login = dados.login.trim();
    if (login.length > 60 || !/^[a-zA-Z0-9._-]+$/.test(login)) {
        throw criarErro(400, "O login deve ter até 60 caracteres e conter apenas letras, números, pontos, traços e underscores.");
    }

    if (typeof dados.senha !== "string" || dados.senha.trim() === "") {
        throw criarErro(400, "Informe a senha.");
    }

    if (Buffer.byteLength(dados.senha, "utf8") > 72) {
        throw criarErro(400, "A senha deve ter no máximo 72 bytes.");
    }

    return { login, senha: dados.senha };
}

// Validar as credenciais e devolver o token com os dados públicos do usuário
async function login(dados) {
    const credenciais = validarCredenciais(dados);
    const configuracao = obterConfiguracaoToken();
    const usuario = await authRepository.buscarPorLogin(credenciais.login);

    const senhaValida = usuario && typeof usuario.senha === "string"
        && await bcrypt.compare(credenciais.senha, usuario.senha);

    if (!senhaValida || usuario.ativo !== true) {

        throw criarErro(401, "Login ou senha inválidos.");
    }

    const token = jwt.sign({}, configuracao.segredo, {
        algorithm: configuracao.algoritmo,
        subject: String(usuario.codUsuario),
        issuer: configuracao.emissor,
        audience: configuracao.destinatario,
        expiresIn: configuracao.expiraEm,
    });

    return {
        token,
        tipoToken: "Bearer",
        expiraEm: configuracao.expiraEm,
        usuario: {
            codUsuario: usuario.codUsuario,
            nome: usuario.nome,
            login: usuario.login,
            ativo: usuario.ativo,
            perfil: usuario.perfil,
        },
    };
}

// Verificar a autenticação e a situação atual do usuário
async function autenticar(token) {
    const configuracao = obterConfiguracaoToken();
    let payload;

    try {
        payload = jwt.verify(token, configuracao.segredo, {
            algorithms: [configuracao.algoritmo],
            issuer: configuracao.emissor,
            audience: configuracao.destinatario,
        });
    } catch (erro) {
        if (erro instanceof jwt.JsonWebTokenError) {
            throw criarErro(401, "Token inválido ou expirado. Faça login novamente.");
        }
        throw erro;
    }

    if (
        typeof payload !== "object" || payload === null ||
        typeof payload.sub !== "string" || !/^[1-9]\d*$/.test(payload.sub) ||
        Number(payload.sub) > 2147483647 ||
        !Number.isInteger(payload.exp) || !Number.isInteger(payload.iat) ||
        payload.exp <= payload.iat
    ) {
        throw criarErro(401, "Token inválido ou expirado. Faça login novamente.");
    }

    const usuario = await authRepository.buscarPorCod(Number(payload.sub));
    if (!usuario || usuario.ativo !== true) {
        throw criarErro(401, "Sessão inválida. Faça login novamente.");
    }

    // Utilizar o perfil atual do banco, e não informações enviadas pelo cliente
    return {
        codUsuario: usuario.codUsuario,
        nome: usuario.nome,
        login: usuario.login,
        ativo: usuario.ativo,
        perfil: usuario.perfil,
    };
}

module.exports = { login, autenticar };
