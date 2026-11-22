import api from "./api.js";
// Montar o endereço do recurso financeiro na API
const caminho = tipo => `/financeiro/${tipo}`;
// Buscar a lista na API com os filtros informados
async function listar(tipo, params = {}, signal) { return (await api.get(caminho(tipo), { params, signal })).data; }
// Buscar os detalhes do registro na API
async function buscar(tipo, codigo, signal) { return (await api.get(`${caminho(tipo)}/${codigo}`, { signal })).data; }
// Enviar os dados para cadastrar o registro na API
async function criar(tipo, dados) { return (await api.post(caminho(tipo), dados)).data; }
// Enviar as alterações do registro para a API
async function atualizar(tipo, codigo, dados) { return (await api.patch(`${caminho(tipo)}/${codigo}`, dados)).data; }
// Pedir a exclusão do registro na API
async function excluir(tipo, codigo) { await api.delete(`${caminho(tipo)}/${codigo}`); }
// Buscar os totais do período na API
async function resumo(params, signal) { return (await api.get("/financeiro/resumo", { params, signal })).data; }
export default { listar, buscar, criar, atualizar, excluir, resumo };
