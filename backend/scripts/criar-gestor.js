const readline = require("node:readline/promises");
const { Writable } = require("node:stream");
const sequelize = require("../src/database/connection");
const usuarioRepository = require("../src/usuario/usuario.repository");
const usuarioService = require("../src/usuario/usuario.service");

// Cadastrar o primeiro gestor quando ainda não existe um gestor ativo
async function criarGestorInicial(dados) {
    const existente = await usuarioRepository.buscarGestorAtivo();
    if (existente) {
        const erro = new Error("Já existe um gestor ativo. Cadastre outros usuários pela API autenticada.");
        erro.status = 409;
        throw erro;
    }

    return usuarioService.criar({
        nome: dados.nome,
        login: dados.login,
        senha: dados.senha,
        ativo: true,
        perfil: "GESTOR",
    });
}

// Ler os dados do gestor pelo ambiente ou pelo terminal
async function lerDados() {
    const dados = {
        nome: process.env.GESTOR_INICIAL_NOME,
        login: process.env.GESTOR_INICIAL_LOGIN,
        senha: process.env.GESTOR_INICIAL_SENHA,
    };

    if (dados.nome && dados.login && dados.senha) return dados;

    if (!process.stdin.isTTY) {
        throw new Error("Execute em um terminal interativo ou informe GESTOR_INICIAL_NOME, GESTOR_INICIAL_LOGIN e GESTOR_INICIAL_SENHA.");
    }

    let ocultar = false;
    const saida = new Writable({
        // Escrever a saída do terminal, ocultando a senha durante a digitação
        write(texto, codificacao, callback) {
            if (!ocultar) process.stdout.write(texto);
            callback();
        },
    });
    const perguntas = readline.createInterface({ input: process.stdin, output: saida, terminal: true });

    try {
        dados.nome = await perguntas.question("Nome do gestor: ");
        dados.login = await perguntas.question("Login: ");
        process.stdout.write("Senha (digitação oculta): ");
        ocultar = true;
        dados.senha = await perguntas.question("");
        process.stdout.write("\n");
        return dados;
    } finally {
        perguntas.close();
    }
}

// Executar o cadastro inicial do gestor e encerrar a conexão
async function executar() {
    try {
        await sequelize.authenticate();
        const usuario = await criarGestorInicial(await lerDados());
        console.log(`Gestor criado com sucesso. Código: ${usuario.codUsuario}.`);
    } catch (erro) {
        console.error(erro.status ? erro.message : "Não foi possível criar o gestor. Confira a conexão, o schema e os dados informados.");
        process.exitCode = 1;
    } finally {
        await sequelize.close();
    }
}

if (require.main === module) executar();

module.exports = { criarGestorInicial };
