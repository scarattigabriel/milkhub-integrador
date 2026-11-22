import api from "./api.js";
// Buscar as coletas do período na API
async function coletas(params, signal) { return (await api.get("/leite/coletas", { params, signal })).data; }
// Buscar os detalhes de uma coleta na API
async function coleta(codigo, signal) { return (await api.get(`/leite/coletas/${codigo}`, { signal })).data; }
// Enviar os dados de uma nova coleta para a API
async function criarColeta(dados) { return (await api.post("/leite/coletas", dados)).data; }
// Enviar as alterações da coleta para a API
async function atualizarColeta(codigo, dados) { return (await api.patch(`/leite/coletas/${codigo}`, dados)).data; }
// Pedir a exclusão da coleta na API
async function excluirColeta(codigo) { await api.delete(`/leite/coletas/${codigo}`); }
// Buscar os totais do período na API
async function resumo(params, signal) { return (await api.get("/leite/resumo-mensal", { params, signal })).data; }
// Buscar os fechamentos de leite na API
async function fechamentos(signal) { return (await api.get("/leite/fechamentos", { signal })).data; }
// Buscar os detalhes de um fechamento na API
async function fechamento(codigo, signal) { return (await api.get(`/leite/fechamentos/${codigo}`, { signal })).data; }
// Enviar os dados de um novo fechamento para a API
async function criarFechamento(dados) { return (await api.post("/leite/fechamentos", dados)).data; }
// Enviar as alterações do fechamento para a API
async function atualizarFechamento(codigo, dados) { return (await api.patch(`/leite/fechamentos/${codigo}`, dados)).data; }
// Enviar os índices de qualidade do leite para a API
async function qualidade(codigo, indices) { return (await api.put(`/leite/fechamentos/${codigo}/qualidade`, { indices })).data; }
export default { coletas, coleta, criarColeta, atualizarColeta, excluirColeta, resumo, fechamentos, fechamento, criarFechamento, atualizarFechamento, qualidade };
