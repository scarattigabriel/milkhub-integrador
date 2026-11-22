import api from "./api.js";

// Enviar os dados para cadastrar o registro na API
async function criar(codAtividade, dados) { return (await api.post("/usos-medicamento", { ...dados, codAtividade: Number(codAtividade) })).data; }
// Enviar as alterações do registro para a API
async function atualizar(codigo, dados) { return (await api.patch(`/usos-medicamento/${codigo}`, dados)).data; }
// Pedir a exclusão do registro na API
async function excluir(codigo) { await api.delete(`/usos-medicamento/${codigo}`); }
// Buscar os animais com carência vigente na API
async function carencias(codAnimal, signal) { return (await api.get("/usos-medicamento/carencias", { params: codAnimal ? { codAnimal } : {}, signal })).data; }
export default { criar, atualizar, excluir, carencias };
