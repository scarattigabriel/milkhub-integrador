import api from "./api.js";

// Buscar a lista na API com os filtros informados
async function listar(busca = "", signal) { return (await api.get("/medicamentos", { params: busca.trim() ? { busca: busca.trim() } : {}, signal })).data; }
// Enviar os dados para cadastrar o registro na API
async function criar(dados) { return (await api.post("/medicamentos", dados)).data; }
// Enviar as alterações do registro para a API
async function atualizar(codigo, dados) { return (await api.patch(`/medicamentos/${codigo}`, dados)).data; }
// Pedir a exclusão do registro na API
async function excluir(codigo) { await api.delete(`/medicamentos/${codigo}`); }
export default { listar, criar, atualizar, excluir };
