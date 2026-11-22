import api from "./api.js";

// Enviar login e senha e receber os dados da sessão
async function login(dados) {
    const resposta = await api.post("/auth/login", {
        login: dados.login.trim(),
        senha: dados.senha,
    }, { semAutenticacao: true });
    return resposta.data;
}

// Buscar os dados da conta conectada
async function me(signal) {
    const resposta = await api.get("/auth/me", { signal });
    return resposta.data;
}

export default { login, me };
