import api from "./api.js";
// Buscar a lista na API com os filtros informados
async function listar(filtros = {}, signal) {
    const campos = ["busca", "perfil", "ativo", "pagina", "limite"];
    const params = Object.fromEntries(campos.filter(c => filtros[c] !== "" && filtros[c] !== undefined).map(c => [c, filtros[c]]));
    return (await api.get("/usuarios", { params, signal })).data;
}
// Buscar os detalhes do registro na API
async function buscar(codigo, signal) { return (await api.get(`/usuarios/${codigo}`, { signal })).data; }
// Enviar os dados para cadastrar o registro na API
async function criar(dados) { return (await api.post("/usuarios", dados)).data; }
// Enviar as alterações do registro para a API
async function atualizar(codigo, dados) { return (await api.patch(`/usuarios/${codigo}`, dados)).data; }
export default { listar, buscar, criar, atualizar };
