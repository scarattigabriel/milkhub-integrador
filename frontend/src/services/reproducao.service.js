import api from "./api.js";
const raiz = "/controle-reprodutivo";
// Buscar a lista na API com os filtros informados
async function listar(tipo, filtros = {}, signal) { return (await api.get(`${raiz}/${tipo}`, { params: filtros, signal })).data; }
// Buscar os detalhes do registro na API
async function buscar(tipo, codigo, signal) { return (await api.get(`${raiz}/${tipo}/${codigo}`, { signal })).data; }
// Enviar o cadastro do evento reprodutivo para a API
async function registrar(tipo, dados) { return (await api.post(`${raiz}/${tipo}`, dados)).data; }
// Buscar os parâmetros das previsões na API
async function parametros(signal) { return (await api.get(`${raiz}/parametros`, { signal })).data; }
// Enviar as novas previsões da gestação para a API
async function ajustar(codigo, dados) { return (await api.patch(`${raiz}/gestacoes/${codigo}`, dados)).data; }
// Enviar o registro de perda gestacional para a API
async function perda(codigo, dados) { return (await api.patch(`${raiz}/gestacoes/${codigo}/perda`, dados)).data; }
export default { listar, buscar, registrar, parametros, ajustar, perda };
