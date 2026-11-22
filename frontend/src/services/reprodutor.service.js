import api from "./api.js";
// Buscar a lista na API com os filtros informados
async function listar(filtros = {}, signal) { return (await api.get("/reprodutores", { params: filtros, signal })).data; }
// Enviar os dados para cadastrar o registro na API
async function criar(dados) { return (await api.post("/reprodutores", dados)).data; }
// Enviar as alterações do registro para a API
async function atualizar(codigo, dados) { return (await api.patch(`/reprodutores/${codigo}`, dados)).data; }
// Pedir a exclusão do registro na API
async function excluir(codigo) { await api.delete(`/reprodutores/${codigo}`); }
export default { listar, criar, atualizar, excluir };
