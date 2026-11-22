import { prepararDataHora } from "./dataHoraLocal.js";
import { filtrosIniciais } from "./formatacao.js";

// Somar dias sem mudar a data por causa do fuso horário
export function somarDiasCivil(valor, quantidade) {
    const data = new Date(`${valor}T12:00:00Z`);
    data.setUTCDate(data.getUTCDate() + quantidade);
    if (!Number.isFinite(data.getTime()) || data.getUTCFullYear() < 1 || data.getUTCFullYear() > 9999) throw new Error("A data sugerida excede o calendário suportado.");
    return data.toISOString().slice(0, 10);
}
// Conferir a data escolhida para o evento reprodutivo
export function validarDataEvento(valor) {
    const data = new Date(`${valor}T12:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(valor || "") || !Number.isFinite(data.getTime()) || data.getUTCFullYear() < 1 || data.toISOString().slice(0, 10) !== valor || valor > filtrosIniciais().dataAgenda) throw new Error("Informe uma data válida, sem estar no futuro.");
    return valor;
}
// Conferir e organizar os dados do reprodutor
export function prepararReprodutor(formulario) {
    const nome = formulario.nome.trim();
    if (!nome || nome.length > 150) throw new Error("Informe o nome do reprodutor com até 150 caracteres.");
    return { nome, numeroRegistro: formulario.numeroRegistro.trim() || null, codRaca: formulario.codRaca ? Number(formulario.codRaca) : null };
}
// Conferir e organizar os dados da inseminação
export function prepararInseminacao(f) {
    if (!f.codAnimal || !f.codReprodutor) throw new Error("Selecione o animal e o reprodutor.");
    const dados = { codAnimal: Number(f.codAnimal), codReprodutor: Number(f.codReprodutor), dataInseminacao: validarDataEvento(f.dataInseminacao),
        tipoSemen: f.tipoSemen.trim() || null, lote: f.lote.trim() || null, observacao: f.observacao.trim() || null, historico: Boolean(f.historico) };
    if (f.dataHoraDiagnostico) {
        if (f.historico) throw new Error("Registro histórico não agenda exame. Limpe o horário do diagnóstico.");
        if (f.dataHoraDiagnostico.slice(0, 10) < f.dataInseminacao) throw new Error("O exame não pode anteceder a inseminação.");
        dados.dataHoraDiagnostico = prepararDataHora(f.dataHoraDiagnostico);
    }
    return dados;
}
// Conferir se as previsões manuais foram preenchidas juntas
export function previsoesManuais(f) {
    if (!f.previsoesManuais) return {};
    return { dataPrevisaoParto: f.dataPrevisaoParto || null, ...(!f.recalcularSecagem ? { dataPrevistaSecagem: f.dataPrevistaSecagem || null } : {}) };
}
// Conferir os dados e os vínculos do diagnóstico
export function prepararDiagnostico(f) {
    if (!f.codAnimal || !f.metodo.trim() || !["POSITIVO", "NEGATIVO", "INCONCLUSIVO"].includes(f.resultado)) throw new Error("Selecione o animal, o resultado e informe o método do diagnóstico.");
    const dados = { codAnimal: Number(f.codAnimal), dataDiagnostico: validarDataEvento(f.dataDiagnostico), metodo: f.metodo.trim(), resultado: f.resultado, observacao: f.observacao?.trim() || null, historico: Boolean(f.historico) };
    for (const campo of ["codInseminacao", "codGestacao"]) if (f[campo]) dados[campo] = Number(f[campo]);
    if (f.resultado === "POSITIVO" && !f.historico) Object.assign(dados, previsoesManuais(f));
    if (f.codAtividade) {
        dados.codAtividade = Number(f.codAtividade);
        dados.dataHoraEncerramento = prepararDataHora(f.dataHoraEncerramento);
        if (f.dataHoraEncerramento.slice(0, 10) !== f.dataDiagnostico) throw new Error("O exame deve ser concluído na mesma data do diagnóstico.");
        if (new Date(dados.dataHoraEncerramento).getTime() > Date.now()) throw new Error("O encerramento do exame não pode estar no futuro.");
    }
    return dados;
}
// Conferir e organizar o cadastro da gestação
export function prepararGestacao(f) {
    if (!f.codAnimal) throw new Error("Selecione o animal adquirido prenhe.");
    return { codAnimal: Number(f.codAnimal), observacao: f.observacao.trim() || null, ...previsoesManuais(f) };
}
// Conferir as novas datas previstas para a gestação
export function prepararPrevisoes(f, original) {
    const dados = { observacao: f.observacao.trim() || null };
    const mudouParto = f.dataPrevisaoParto !== (original.dataPrevisaoParto || "");
    if (mudouParto) dados.dataPrevisaoParto = f.dataPrevisaoParto || null;
    if (!(f.recalcularSecagem && mudouParto) && f.dataPrevistaSecagem !== (original.dataPrevistaSecagem || "")) dados.dataPrevistaSecagem = f.dataPrevistaSecagem || null;
    return dados;
}
// Conferir os campos do parto, da secagem ou da perda
export function prepararEvento(tipo, f) {
    const data = validarDataEvento(f.data);
    const dados = { observacao: f.observacao?.trim() || null, historico: Boolean(f.historico) };
    if (tipo === "perdas") return { ...dados, dataEncerramento: data };
    if (!f.codAnimal) throw new Error("Selecione a fêmea do evento.");
    if (f.codGestacao) dados.codGestacao = Number(f.codGestacao);
    if (tipo === "secagens") return { ...dados, codAnimal: Number(f.codAnimal), dataSecagem: data };
    if (tipo !== "partos") throw new Error("Tipo de evento inválido.");
    const crias = f.crias.map(Number);
    if (new Set(crias).size !== crias.length || crias.includes(Number(f.codAnimal))) throw new Error("Não repita crias nem selecione a própria mãe.");
    return { ...dados, codAnimalMae: Number(f.codAnimal), dataParto: data, crias };
}
// Encontrar os animais que podem ser vinculados ao parto
export function criasElegiveis(animais, f) {
    return animais.filter(a => a.dataNascimento === f.data && String(a.codAnimal) !== f.codAnimal && a.codParto == null && (a.codAnimalMae == null || String(a.codAnimalMae) === f.codAnimal));
}
