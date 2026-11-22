import api from "./api.js";

// Buscar os indicadores do dashboard na API
async function consultar(filtros, signal) {
    const resposta = await api.get("/dashboard", { params: {
        mes: filtros.mes, ano: filtros.ano,
        dataAgenda: filtros.dataAgenda, periodoAgenda: filtros.periodoAgenda,
    }, signal });
    return resposta.data;
}

export default { consultar };
