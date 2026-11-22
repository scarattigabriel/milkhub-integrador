// Conferir a senha e o campo de confirmação
export function validarSenha(senha, confirmacao) {
    if (typeof senha !== "string" || !senha.trim() || senha.length < 8 || new TextEncoder().encode(senha).length > 72) throw new Error("A senha deve ter pelo menos 8 caracteres e no máximo 72 bytes.");
    if (senha !== confirmacao) throw new Error("A confirmação deve ser igual à senha.");
    return senha;
}
// Conferir e organizar os dados da conta
export function prepararUsuario(f, original = null) {
    const nome = f.nome.trim(), login = f.login.trim();
    if (!nome || nome.length > 150 || !/^[\p{L}\p{M}]+(?:[ '\u2019-]+[\p{L}\p{M}]+)*$/u.test(nome)) throw new Error("Informe um nome de até 150 caracteres, usando letras, espaços, apóstrofos ou hífens.");
    if (!/^[a-zA-Z0-9._-]{1,60}$/.test(login)) throw new Error("O login deve ter até 60 caracteres: letras, números, ponto, traço ou underscore.");
    if (!["GESTOR", "COLABORADOR"].includes(f.perfil) || typeof f.ativo !== "boolean") throw new Error("Selecione um perfil e uma situação válidos.");
    return { nome, login, perfil: f.perfil, ...(!original ? { ativo: f.ativo, senha: validarSenha(f.senha, f.confirmacao) } : {}) };
}
// Conferir a nova senha antes de enviar a alteração
export function prepararSenha(f) { return { senha: validarSenha(f.senha, f.confirmacao) }; }
// Conferir se a alteração tira o acesso de gestor da conta
export function perdeAcessoGestao(atual, alterado) {
    return Number(atual?.codUsuario) === Number(alterado.codUsuario) && (!alterado.ativo || alterado.perfil !== "GESTOR");
}
