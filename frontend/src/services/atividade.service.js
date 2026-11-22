import api from "./api.js";

// Buscar a lista na API com os filtros informados
async function listar(filtros = {}, signal) { return (await api.get("/atividades", { params: filtros, signal })).data; }
// Buscar os detalhes do registro na API
async function buscar(codigo, signal) { return (await api.get(`/atividades/${codigo}`, { signal })).data; }
// Enviar os dados para cadastrar o registro na API
async function criar(dados) { return (await api.post("/atividades", dados)).data; }
// Enviar as alterações do registro para a API
async function atualizar(codigo, dados) { return (await api.patch(`/atividades/${codigo}`, dados)).data; }
// Conferir os dados e confirmar a conclusão da atividade
async function concluir(codigo, dados) { return (await api.patch(`/atividades/${codigo}/concluir`, dados)).data; }
// Pedir o cancelamento da atividade na API
async function cancelar(codigo) { return (await api.patch(`/atividades/${codigo}/cancelar`, {})).data; }
export default { listar, buscar, criar, atualizar, concluir, cancelar };
