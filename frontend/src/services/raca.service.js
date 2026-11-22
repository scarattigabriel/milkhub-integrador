import api from "./api.js";

// Buscar a lista na API com os filtros informados
async function listar(signal) { return (await api.get("/racas", { signal })).data; }
// Enviar os dados para cadastrar o registro na API
async function criar(nome) { return (await api.post("/racas", { nome: nome.trim() })).data; }
// Enviar as alterações do registro para a API
async function atualizar(codigo, nome) { return (await api.patch(`/racas/${codigo}`, { nome: nome.trim() })).data; }
// Pedir a exclusão do registro na API
async function excluir(codigo) { await api.delete(`/racas/${codigo}`); }

export default { listar, criar, atualizar, excluir };
