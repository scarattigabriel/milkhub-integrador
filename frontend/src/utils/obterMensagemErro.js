import axios from "axios";

// Escolher uma mensagem de erro que possa ser mostrada na tela
function obterMensagemErro(erro, mensagemPadrao = "Não foi possível concluir a solicitação. Tente novamente.") {
    if (axios.isCancel(erro)) return "A solicitação foi cancelada.";
    if (!axios.isAxiosError(erro)) return mensagemPadrao;

    const mensagem = erro.response?.data?.mensagem;
    if (typeof mensagem === "string" && mensagem.trim()) return mensagem;
    if (erro.code === "ECONNABORTED" || erro.code === "ETIMEDOUT") return "A solicitação demorou mais que o esperado. Tente novamente.";
    if (!erro.response) return "Não foi possível conectar ao sistema. Verifique sua conexão e tente novamente.";
    return mensagemPadrao;
}

export default obterMensagemErro;
