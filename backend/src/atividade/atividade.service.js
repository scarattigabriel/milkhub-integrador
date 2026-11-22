const repository = require("./atividade.repository");
const usoRepository = require("../uso-medicamento/uso-medicamento.repository");
const usoService = require("../uso-medicamento/uso-medicamento.service");
const { criarErro, objeto, codigo, texto, dataHora } = require("../utils/validacao");
const { normalizarTipo } = require("../config/tipos-atividade");

// Conferir e normalizar os campos enviados para a operação
function validarDados(dados, parcial = false) {
    objeto(dados, ["titulo", "tipo", "descricao", "dataHoraPrevista", "animais", ...(!parcial ? ["usosMedicamento"] : [])]);
    if (!Object.keys(dados).length) throw criarErro(400, "Informe os dados da atividade.");
    const valores = {};
    for (const [campo, limite] of [["titulo", 150], ["tipo", 50], ["descricao", null]]) {
        if (!parcial || Object.hasOwn(dados, campo)) {
            valores[campo] = campo === "descricao" && !Object.hasOwn(dados, campo) ? null
                : texto(dados[campo], campo, limite, campo === "descricao");
        }
    }
    if (Object.hasOwn(valores, "tipo")) valores.tipo = normalizarTipo(valores.tipo);
    if (!parcial || Object.hasOwn(dados, "dataHoraPrevista")) {
        valores.dataHoraPrevista = dataHora(dados.dataHoraPrevista, "dataHoraPrevista");
    }
    if (Object.hasOwn(dados, "animais") || !parcial) {
        const animais = dados.animais === undefined ? [] : dados.animais;
        if (!Array.isArray(animais)) throw criarErro(400, "animais deve ser uma lista de códigos.");
        valores.animais = animais.map(valor => codigo(valor, "codAnimal"));
        if (new Set(valores.animais).size !== valores.animais.length) throw criarErro(400, "Não repita animais na atividade.");
        valores.animais.sort((a, b) => a - b);
    }
    return valores;
}

// Conferir existência, situação e nascimento dos animais participantes
async function validarAnimais(animais, data, transacao, encerrada = false) {
    for (const id of [...animais].sort((a, b) => a - b)) {
        const animal = await repository.buscarAnimal(id, transacao);
        if (!animal) throw criarErro(400, "Um dos animais informados não existe.");
        usoService.validarDataDoAnimal(animal, data, encerrada);
    }
}

// Validar os dados e cadastrar o registro
async function criar(dados) {
    const { animais, ...valores } = validarDados(dados);
    const usos = dados.usosMedicamento === undefined ? [] : dados.usosMedicamento;
    if (!Array.isArray(usos)) throw criarErro(400, "usosMedicamento deve ser uma lista.");
    try {
        return await repository.executarEmTransacao(async transacao => {
            await validarAnimais(animais, valores.dataHoraPrevista, transacao);
            const atividade = await repository.criar({ ...valores, situacao: "AGENDADA", dataHoraEncerramento: null }, transacao);
            await repository.substituirParticipacoes(atividade.codAtividade, animais, transacao);
            for (const uso of usos) await usoService.criarNaTransacao(uso, atividade, transacao);
            return repository.buscarDetalhes(atividade.codAtividade, transacao);
        });
    } catch (erro) { throw usoService.tratarErro(erro); }
}

// Validar as alterações e atualizar o registro
async function atualizar(codAtividade, dados) {
    const id = codigo(codAtividade, "codAtividade");
    const { animais, ...valores } = validarDados(dados, true);
    try {
        return await repository.executarEmTransacao(async transacao => {
            const atividade = await repository.buscarPorCod(id, transacao);
            usoService.exigirAgendada(atividade);
            const participacoes = await repository.listarParticipacoes(id, transacao);
            const codigos = animais === undefined ? participacoes.map(item => item.codAnimal) : animais;
            if (animais !== undefined || valores.dataHoraPrevista) {
                await validarAnimais(codigos, valores.dataHoraPrevista || atividade.dataHoraPrevista, transacao);
            }
            if (animais !== undefined) {
                const usos = await usoRepository.listarDaAtividade(id, transacao);
                if (usos.some(uso => !animais.includes(uso.codAnimal))) {
                    throw criarErro(409, "Remova os usos planejados antes de retirar o animal da atividade.");
                }
                await repository.substituirParticipacoes(id, animais, transacao);
            }
            await repository.atualizar(atividade, valores, transacao);
            return repository.buscarDetalhes(id, transacao);
        });
    } catch (erro) { throw usoService.tratarErro(erro); }
}

// Registrar a conclusão ou o cancelamento da atividade
async function encerrar(codAtividade, dados, situacao) {
    const id = codigo(codAtividade, "codAtividade");
    objeto(dados, situacao === "CONCLUIDA" ? ["dataHoraEncerramento", "usosMedicamento"] : ["dataHoraEncerramento"]);
    try {
        return await repository.executarEmTransacao(async transacao => {
            const atividade = await repository.buscarPorCod(id, transacao);
            usoService.exigirAgendada(atividade);

            const padrao = situacao === "CONCLUIDA" ? new Date(atividade.dataHoraPrevista).toISOString() : new Date().toISOString();
            const encerramento = dataHora(Object.hasOwn(dados, "dataHoraEncerramento") ? dados.dataHoraEncerramento : padrao,
                "dataHoraEncerramento", true);
            if (situacao === "CONCLUIDA") {
                const participacoes = await repository.listarParticipacoes(id, transacao);
                await validarAnimais(participacoes.map(item => item.codAnimal), encerramento, transacao, true);
                await usoService.concluirDaAtividade(atividade,
                    dados.usosMedicamento === undefined ? [] : dados.usosMedicamento, encerramento, transacao);
            }
            await repository.atualizar(atividade, { situacao, dataHoraEncerramento: encerramento }, transacao);
            return repository.buscarDetalhes(id, transacao);
        });
    } catch (erro) { throw usoService.tratarErro(erro); }
}

// Listar os registros com os filtros validados
async function listar(filtros = {}) {
    objeto(filtros, ["situacao", "tipo", "de", "ate", "codAnimal", "pendentes"]);
    const valores = {};
    if (Object.hasOwn(filtros, "situacao")) {
        if (!["AGENDADA", "CONCLUIDA", "CANCELADA"].includes(filtros.situacao)) throw criarErro(400, "Situação inválida.");
        valores.situacao = filtros.situacao;
    }
    if (Object.hasOwn(filtros, "tipo")) valores.tipo = normalizarTipo(filtros.tipo);
    if (Object.hasOwn(filtros, "codAnimal")) valores.codAnimal = codigo(filtros.codAnimal, "codAnimal");
    for (const campo of ["de", "ate"]) {
        if (Object.hasOwn(filtros, campo)) valores[campo] = dataHora(filtros[campo], campo);
    }
    if (valores.de && valores.ate && valores.de > valores.ate) throw criarErro(400, "O início do período deve anteceder o fim.");
    if (Object.hasOwn(filtros, "pendentes")) {
        if (!["true", "false"].includes(filtros.pendentes)) throw criarErro(400, "pendentes deve ser true ou false.");
        valores.pendentes = filtros.pendentes === "true";
        if (valores.pendentes && valores.situacao && valores.situacao !== "AGENDADA") {
            throw criarErro(400, "Pendências correspondem somente a atividades agendadas.");
        }
    }
    return repository.listar(valores);
}

// Buscar o registro pelo código e conferir se ele existe
async function buscarPorCod(codAtividade) {
    const atividade = await repository.buscarDetalhes(codigo(codAtividade, "codAtividade"));
    if (!atividade) throw criarErro(404, "Atividade não encontrada.");
    return atividade;
}

module.exports = {
    listar, buscarPorCod, criar, atualizar,
    // Concluir a atividade e confirmar as aplicações vinculadas
    concluir: (id, dados) => encerrar(id, dados, "CONCLUIDA"),
    // Cancelar a atividade sem iniciar aplicações ou carências
    cancelar: (id, dados) => encerrar(id, dados, "CANCELADA"),
};
