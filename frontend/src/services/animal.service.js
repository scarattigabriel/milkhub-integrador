import api from "./api.js";

// Buscar a lista na API com os filtros informados
async function listar(filtros = {}, signal) {
    const permitidos = ["busca", "sexo", "situacaoRebanho", "categoria", "situacaoLactacao", "prenha", "codRaca"];
    const params = Object.fromEntries(permitidos.filter(c => filtros[c] !== undefined && filtros[c] !== "").map(c => [c, filtros[c]]));
    return (await api.get("/animais", { params, signal })).data;
}
// Buscar os detalhes do registro na API
async function buscar(codigo, signal) { return (await api.get(`/animais/${codigo}`, { signal })).data; }
// Buscar os eventos do animal na API
async function historico(codigo, signal) { return (await api.get(`/animais/${codigo}/historico`, { signal })).data; }
// Enviar os dados para cadastrar o registro na API
async function criar(dados) { return (await api.post("/animais", dados)).data; }
// Enviar as alterações do registro para a API
async function atualizar(codigo, dados) { return (await api.patch(`/animais/${codigo}`, dados)).data; }
// Enviar os dados da saída do animal para a API
async function registrarSaida(codigo, dados) { return (await api.patch(`/animais/${codigo}/saida`, dados)).data; }
// Buscar os partos disponíveis para vincular ao animal
async function partos(signal) { return (await api.get("/controle-reprodutivo/partos", { signal })).data; }

export default { listar, buscar, historico, criar, atualizar, registrarSaida, partos };
