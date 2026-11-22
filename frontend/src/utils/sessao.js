const CHAVE_TOKEN = "gestao-leiteira.token";

// Manter a sessão somente em memória até recarregar, sem impedir o logout
// Organizar o armazenamento do token da sessão
export function criarSessao(acessarStorage = () => sessionStorage) {
    let tokenEmMemoria = null;
    let somenteMemoria = false;

    // Ler o token salvo para a sessão
    function obterToken() {
        if (!somenteMemoria) {
            try { tokenEmMemoria = acessarStorage().getItem(CHAVE_TOKEN); }
            catch { somenteMemoria = true; }
        }
        return tokenEmMemoria;
    }

    // Guardar o token da sessão no navegador
    function salvarToken(token) {
        tokenEmMemoria = token;
        if (!somenteMemoria) {
            try { acessarStorage().setItem(CHAVE_TOKEN, token); }
            catch { somenteMemoria = true; }
        }
    }

    // Remover o token quando a sessão termina
    function removerToken() {
        tokenEmMemoria = null;
        if (!somenteMemoria) {
            try { acessarStorage().removeItem(CHAVE_TOKEN); }
            catch { somenteMemoria = true; }
        }
    }

    return { obterToken, salvarToken, removerToken };
}

export const { obterToken, salvarToken, removerToken } = criarSessao();
