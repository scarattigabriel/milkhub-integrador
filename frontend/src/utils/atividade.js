import { prepararDataHora, exibirDataHoraLocal } from "./dataHoraLocal.js";

export const tiposAtividade = [["TRABALHO", "Trabalho na propriedade"], ["EXAME", "Exame"], ["VACINACAO", "Vacinação"],
    ["TRATAMENTO", "Tratamento"], ["APLICACAO_MEDICAMENTO", "Aplicação de medicamento"], ["DESALEITAMENTO", "Desaleitamento"], ["OUTRA", "Outra"]];
export const sanitarios = ["VACINACAO", "TRATAMENTO", "APLICACAO_MEDICAMENTO"];
// Encontrar o nome que será mostrado para o tipo de atividade
export const nomeTipo = tipo => tiposAtividade.find(([codigo]) => codigo === tipo)?.[1] || tipo;

// Identificar atrasos sem alterar a situação salva no banco
export function situacaoDaAtividade(atividade, agora = Date.now()) {
    return atividade.situacao === "AGENDADA" && new Date(atividade.dataHoraPrevista).getTime() < Number(agora)
        ? "ATRASADA" : atividade.situacao;
}

// Conferir e organizar os campos do uso de medicamento
export function prepararUso(formulario) {
    const codAnimal = Number(formulario.codAnimal), codMedicamento = Number(formulario.codMedicamento);
    if (!Number.isInteger(codAnimal) || codAnimal < 1 || !Number.isInteger(codMedicamento) || codMedicamento < 1) throw new Error("Selecione o animal e o medicamento.");
    const valor = formulario.valorCarencia === "" || formulario.valorCarencia == null ? null : Number(formulario.valorCarencia);
    const unidade = formulario.unidadeCarencia || null;
    if ((valor === null) !== (unidade === null)) throw new Error("Informe unidade e valor da carência juntos.");
    if (valor !== null && (!Number.isInteger(valor) || valor < 0 || valor > 2147483647)) throw new Error("A carência deve ser um número inteiro não negativo.");
    return { codAnimal, codMedicamento, dose: formulario.dose?.trim() || null,
        unidadeCarencia: unidade, valorCarencia: valor, observacao: formulario.observacao?.trim() || null };
}

// Conferir e organizar os dados do agendamento
export function prepararAtividade(formulario, criacao = true) {
    const titulo = formulario.titulo.trim();
    if (!titulo || titulo.length > 150) throw new Error("Informe um título de até 150 caracteres.");
    const dados = { titulo, tipo: formulario.tipo, descricao: formulario.descricao.trim() || null,
        dataHoraPrevista: prepararDataHora(formulario.dataHoraPrevista), animais: formulario.animais.map(Number) };
    if (criacao) dados.usosMedicamento = formulario.usosMedicamento.map(prepararUso);
    return dados;
}

// Preencher o formulário com os dados da atividade
export function formularioDaAtividade(a) {
    return { titulo: a?.titulo || "", tipo: a?.tipo || "TRABALHO", descricao: a?.descricao || "",
        dataHoraPrevista: exibirDataHoraLocal(a?.dataHoraPrevista || new Date(Date.now() + 3600000)).slice(0, 16),
        animais: a?.participacoes.map(p => String(p.codAnimal)) || [], usosMedicamento: [] };
}

// Conferir as aplicações e os dados para concluir a atividade
export function prepararConclusao(formulario, atividade, agora = Date.now()) {
    const encerramento = prepararDataHora(formulario.dataHoraEncerramento);
    if (new Date(encerramento).getTime() > agora) throw new Error("O encerramento não pode estar no futuro. Informe o horário em que a atividade foi realizada.");
    if (sanitarios.includes(atividade.tipo) && (!atividade.participacoes.length || atividade.participacoes.some(p => !atividade.usosMedicamento.some(u => u.codAnimal === p.codAnimal)))) {
        throw new Error("Inclua ao menos um medicamento para cada animal participante antes de concluir esta atividade sanitária.");
    }
    const usosMedicamento = formulario.usosMedicamento.map(uso => {
        const dose = uso.dose.trim(), valor = uso.valorCarencia === "" ? NaN : Number(uso.valorCarencia);
        if (!dose || dose.length > 50 || !["HORAS", "DIAS"].includes(uso.unidadeCarencia) || !Number.isInteger(valor) || valor < 0 || valor > 2147483647) {
            throw new Error("Confirme dose, unidade e carência inteira não negativa de todas as aplicações. Informe zero quando não houver carência.");
        }
        const aplicacao = prepararDataHora(uso.dataHoraAplicacao);
        if (aplicacao > encerramento) throw new Error("A aplicação não pode ocorrer depois do encerramento da atividade.");
        return { codUso: uso.codUso, dose, unidadeCarencia: uso.unidadeCarencia, valorCarencia: valor,
            dataHoraAplicacao: aplicacao, observacao: uso.observacao.trim() || null };
    });
    return { dataHoraEncerramento: encerramento, usosMedicamento };
}
