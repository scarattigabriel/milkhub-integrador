const { UniqueConstraintError, ForeignKeyConstraintError, ValidationError } = require("sequelize");
const repository = require("./controle-reprodutivo.repository");
const atividadeRepository = require("../atividade/atividade.repository");
const { obterParametros } = require("../config/reproducao");
const usoRepository = require("../uso-medicamento/uso-medicamento.repository");
const { normalizarTipo } = require("../config/tipos-atividade");
const { criarErro, objeto, codigo, texto, dataHora, diaLocal, dataCivil, somarDias } = require("../utils/validacao");

const SITUACOES = ["EM_ANDAMENTO", "ENCERRADA_PARTO", "ENCERRADA_NEGATIVO", "ENCERRADA_PERDA"];
const RESULTADOS = ["POSITIVO", "NEGATIVO", "INCONCLUSIVO"];

// Normalizar a observação opcional do evento reprodutivo
function observacao(dados) {
    return Object.hasOwn(dados, "observacao") ? texto(dados.observacao, "observacao", null, true) : null;
}
// Validar um código opcional e manter null quando ele não é informado
function codigoOpcional(dados, campo) {
    return dados[campo] == null ? null : codigo(dados[campo], campo);
}
// Converter falhas conhecidas em erros adequados para a operação
function tratarErro(erro) {
    if (erro instanceof UniqueConstraintError) return criarErro(409, "A inseminação já possui gestação ou a gestação já possui parto/secagem vinculados.");
    if (erro instanceof ForeignKeyConstraintError) return criarErro(400, "Um dos vínculos reprodutivos não existe ou foi alterado.");
    if (erro instanceof ValidationError) return criarErro(400, "Os dados reprodutivos são inválidos.");
    if (["40001", "40P01"].includes(erro.original?.code)) return criarErro(409, "Houve uma alteração simultânea. Consulte novamente e tente outra vez.");
    return erro;
}
// Executar a operação reprodutiva em uma transação e tratar suas falhas
async function transacao(operacao) {
    try { return await repository.executarEmTransacao(operacao); } catch (erro) { throw tratarErro(erro); }
}

// Buscar a fêmea e conferir sua situação na data do evento
async function femea(id, data, tx) {
    const animal = await repository.buscarAnimal(id, tx);
    if (!animal) throw criarErro(404, "Animal não encontrado.");
    if (animal.sexo !== "F" || (animal.situacaoRebanho !== "ATIVA" && (!data || !animal.dataSaida))) throw criarErro(400, "O evento requer uma fêmea; alterações atuais requerem animal ativo.");
    if (data && animal.dataSaida && data > animal.dataSaida) throw criarErro(400, "O evento não pode ocorrer depois da saída do animal.");
    if (data && data < animal.dataNascimento) throw criarErro(400, "O evento não pode anteceder o nascimento.");
    return animal;
}
// Definir se o evento pode atualizar o estado atual ou pertence ao histórico
async function contextoEstado(animal, data, estado, dados, tx) {
    if (Object.hasOwn(dados, "historico") && typeof dados.historico !== "boolean") throw criarErro(400, "historico deve ser booleano.");
    const ultima = await repository.ultimaDataEstado(animal.codAnimal, estado, tx);
    const inseminacao = estado === "prenha" ? await repository.ultimaInseminacao(animal.codAnimal, tx) : null;
    return { historico: dados.historico === true || animal.situacaoRebanho !== "ATIVA"
        || Boolean(ultima && data < ultima) || Boolean(inseminacao && data < inseminacao.dataInseminacao) };
}

// Conferir a data do evento em relação à origem da gestação
async function validarCiclo(gestacao, data, tx) {
    if (!gestacao) return;
    const origem = gestacao.codInseminacao ? await repository.buscar("inseminacoes", gestacao.codInseminacao, tx) : null;
    if ((origem && data < origem.dataInseminacao) || (gestacao.dataEncerramento && data > gestacao.dataEncerramento)) {
        throw criarErro(400, "A data não pertence ao período da gestação informada.");
    }
}

// Impedir encerrar uma gestação antes dos eventos já registrados
async function validarEncerramento(gestacao, data, tx) {
    await validarCiclo(gestacao, data, tx);
    const ultima = await repository.ultimaDataDaGestacao(gestacao.codGestacao, tx);
    if (ultima && data < ultima) throw criarErro(409, "O encerramento contradiz eventos posteriores dessa gestação.");
}

// Buscar e validar a gestação vinculada ao evento
async function obterGestacao(codAnimal, id, tx, historico = false) {
    if (historico && !id) return null;
    const ativa = await repository.gestacaoAtiva(codAnimal, tx);
    const gestacao = id ? await repository.buscar("gestacoes", id, tx) : ativa;
    if (id && !gestacao) throw criarErro(404, "Gestação não encontrada.");
    if (gestacao && (gestacao.codAnimal !== codAnimal || (!historico && (gestacao.situacao !== "EM_ANDAMENTO"
        || (ativa && ativa.codGestacao !== gestacao.codGestacao))))) {
        throw criarErro(409, "A gestação deve pertencer ao animal e estar em andamento.");
    }
    return gestacao;
}

// Calcular ou validar as previsões de parto e secagem
function previsoes(dados, animal, inseminacao, atual = null) {
    const parametros = obterParametros();
    const mudouParto = Object.hasOwn(dados, "dataPrevisaoParto");
    let parto = atual ? atual.dataPrevisaoParto : (inseminacao ? somarDias(inseminacao.dataInseminacao, parametros.diasGestacao) : null);
    if (mudouParto) parto = dados.dataPrevisaoParto === null ? null : dataCivil(dados.dataPrevisaoParto, "dataPrevisaoParto", true);
    let secagem = atual ? atual.dataPrevistaSecagem : (parto ? somarDias(parto, -parametros.diasAntesPartoSecagem) : null);
    if (mudouParto) secagem = parto ? somarDias(parto, -parametros.diasAntesPartoSecagem) : null;
    if (Object.hasOwn(dados, "dataPrevistaSecagem")) {
        secagem = dados.dataPrevistaSecagem === null ? null : dataCivil(dados.dataPrevistaSecagem, "dataPrevistaSecagem", true);
    }
    const inicio = inseminacao?.dataInseminacao ?? animal.dataNascimento;
    if ((parto && parto <= inicio) || (secagem && secagem < inicio) || (parto && secagem && secagem > parto)) {
        throw criarErro(400, "As previsões devem respeitar a inseminação/nascimento e a secagem não pode ultrapassar o parto previsto.");
    }
    return { dataPrevisaoParto: parto, dataPrevistaSecagem: secagem };
}

// Acrescentar a janela sugerida de diagnóstico à inseminação
function apresentarInseminacao(registro) {
    const parametros = obterParametros();
    const dados = registro.get({ plain: true });
    const diagnosticos = [...(dados.diagnosticos || [])].sort((a, b) => b.dataDiagnostico.localeCompare(a.dataDiagnostico) || b.codDiagnostico - a.codDiagnostico);
    const conclusivo = diagnosticos.find(item => item.resultado !== "INCONCLUSIVO");
    return { ...dados, confirmacaoPrenhez: conclusivo?.resultado || "PENDENTE",
        janelaDiagnostico: { inicio: somarDias(dados.dataInseminacao, parametros.diasDiagnosticoMin), fim: somarDias(dados.dataInseminacao, parametros.diasDiagnosticoMax) } };
}

// Validar a inseminação e registrar os vínculos e o exame opcional
async function registrarInseminacao(dados) {
    objeto(dados, ["codAnimal", "codReprodutor", "dataInseminacao", "tipoSemen", "lote", "observacao", "dataHoraDiagnostico", "historico"]);
    const valores = { codAnimal: codigo(dados.codAnimal, "codAnimal"), codReprodutor: codigo(dados.codReprodutor, "codReprodutor"),
        dataInseminacao: dataCivil(dados.dataInseminacao, "dataInseminacao"), observacao: observacao(dados),
        tipoSemen: Object.hasOwn(dados, "tipoSemen") ? texto(dados.tipoSemen, "tipoSemen", 50, true) : null,
        lote: Object.hasOwn(dados, "lote") ? texto(dados.lote, "lote", 50, true) : null };
    const agenda = Object.hasOwn(dados, "dataHoraDiagnostico") ? dataHora(dados.dataHoraDiagnostico, "dataHoraDiagnostico") : null;
    if (agenda && diaLocal(agenda) < valores.dataInseminacao) throw criarErro(400, "O diagnóstico previsto não pode anteceder a inseminação.");
    return transacao(async tx => {
        const animal = await femea(valores.codAnimal, valores.dataInseminacao, tx);
        const contexto = await contextoEstado(animal, valores.dataInseminacao, "prenha", dados, tx);
        if (contexto.historico && agenda) throw criarErro(400, "Registro histórico não agenda exames; use a agenda separadamente.");
        if (!contexto.historico && (animal.prenha === "S" || await repository.gestacaoAtiva(animal.codAnimal, tx))) throw criarErro(409, "O animal já está prenhe ou possui gestação em andamento.");
        if (!await repository.buscarReprodutor(valores.codReprodutor, tx)) throw criarErro(400, "Reprodutor não encontrado.");
        const registro = await repository.criar("inseminacoes", valores, tx);
        let atividadeDiagnostico = null;
        if (agenda) {
            atividadeDiagnostico = await atividadeRepository.criar({ titulo: "Diagnóstico de gestação", tipo: "EXAME",
                descricao: `Acompanhamento da inseminação ${registro.codInseminacao}.`, dataHoraPrevista: agenda,
                situacao: "AGENDADA", dataHoraEncerramento: null }, tx);
            await atividadeRepository.substituirParticipacoes(atividadeDiagnostico.codAtividade, [animal.codAnimal], tx);
        }
        return { ...apresentarInseminacao(await repository.detalhes("inseminacoes", registro.codInseminacao, tx)), atividadeDiagnostico, registroHistorico: contexto.historico };
    });
}

// Preparar o exame agendado que poderá ser concluído com o diagnóstico
async function prepararExame(dados, codAnimal, dataDiagnostico, tx) {
    if (!Object.hasOwn(dados, "codAtividade")) {
        if (Object.hasOwn(dados, "dataHoraEncerramento")) throw criarErro(400, "Informe codAtividade para concluir o exame agendado.");
        return null;
    }
    const atividade = await atividadeRepository.buscarPorCod(codigo(dados.codAtividade, "codAtividade"), tx);
    if (!atividade) throw criarErro(404, "Atividade não encontrada.");
    if (atividade.situacao !== "AGENDADA" || normalizarTipo(atividade.tipo) !== "EXAME") throw criarErro(409, "Vincule um exame agendado.");
    const participantes = await atividadeRepository.listarParticipacoes(atividade.codAtividade, tx);
    if (participantes.length !== 1 || participantes[0].codAnimal !== codAnimal) throw criarErro(400, "A conclusão conjunta requer exame exclusivo desse animal. Exames de grupo são concluídos pela agenda.");
    if ((await usoRepository.listarDaAtividade(atividade.codAtividade, tx)).length) throw criarErro(400, "Atividades com medicamentos devem ser concluídas pelo fluxo de aplicações.");
    const encerramento = dataHora(dados.dataHoraEncerramento === undefined ? new Date(atividade.dataHoraPrevista).toISOString() : dados.dataHoraEncerramento,
        "dataHoraEncerramento", true);
    if (diaLocal(encerramento) !== dataDiagnostico) throw criarErro(400, "Informe um horário efetivo na mesma data do diagnóstico.");
    return { atividade, encerramento };
}

// Concluir o exame vinculado ao diagnóstico na mesma transação
async function concluirExame(exame, tx) {
    if (exame) await atividadeRepository.atualizar(exame.atividade, { situacao: "CONCLUIDA", dataHoraEncerramento: exame.encerramento }, tx);
}

// Registrar o diagnóstico e atualizar o ciclo reprodutivo quando aplicável
async function registrarDiagnostico(dados) {
    objeto(dados, ["codAnimal", "codInseminacao", "codGestacao", "dataDiagnostico", "metodo", "resultado", "observacao", "dataPrevisaoParto", "dataPrevistaSecagem", "historico", "codAtividade", "dataHoraEncerramento"]);
    const valores = { codAnimal: codigo(dados.codAnimal, "codAnimal"), dataDiagnostico: dataCivil(dados.dataDiagnostico, "dataDiagnostico"),
        metodo: texto(dados.metodo, "metodo", 50), resultado: dados.resultado, observacao: observacao(dados) };
    if (!RESULTADOS.includes(valores.resultado)) throw criarErro(400, "Resultado deve ser POSITIVO, NEGATIVO ou INCONCLUSIVO.");
    if (valores.resultado !== "POSITIVO" && ["dataPrevisaoParto", "dataPrevistaSecagem"].some(campo => Object.hasOwn(dados, campo))) {
        throw criarErro(400, "Previsões são informadas somente com diagnóstico positivo.");
    }
    const idInseminacao = codigoOpcional(dados, "codInseminacao"), idGestacao = codigoOpcional(dados, "codGestacao");
    return transacao(async tx => {
        // Manter a ordem de bloqueio da agenda: atividade antes do animal
        const exame = await prepararExame(dados, valores.codAnimal, valores.dataDiagnostico, tx);
        const animal = await femea(valores.codAnimal, valores.dataDiagnostico, tx);
        const contexto = await contextoEstado(animal, valores.dataDiagnostico, "prenha", dados, tx);
        let gestacao = await obterGestacao(animal.codAnimal, idGestacao, tx, contexto.historico);
        await validarCiclo(gestacao, valores.dataDiagnostico, tx);
        let inseminacao = null;
        if (gestacao) {
            if (idInseminacao && idInseminacao !== gestacao.codInseminacao) throw criarErro(400, "A inseminação difere da vinculada à gestação.");
            if (gestacao.codInseminacao) inseminacao = await repository.buscar("inseminacoes", gestacao.codInseminacao, tx);
        } else if (idInseminacao) {
            inseminacao = await repository.buscar("inseminacoes", idInseminacao, tx);
            if (!inseminacao) throw criarErro(404, "Inseminação não encontrada.");
        } else if (!contexto.historico) {
            const ultima = await repository.ultimaInseminacao(animal.codAnimal, tx);
            if (ultima && !await repository.gestacaoDaInseminacao(ultima.codInseminacao, tx)) inseminacao = ultima;
        }
        if (inseminacao) {
            if (inseminacao.codAnimal !== animal.codAnimal || inseminacao.dataInseminacao > valores.dataDiagnostico) throw criarErro(400, "A inseminação deve pertencer ao animal e anteceder o diagnóstico.");
            const ultima = await repository.ultimaInseminacao(animal.codAnimal, tx);
            if (!contexto.historico && !gestacao && ultima && ultima.codInseminacao !== inseminacao.codInseminacao) throw criarErro(409, "Use a inseminação mais recente para não sobrescrever o ciclo atual.");
            const vinculada = await repository.gestacaoDaInseminacao(inseminacao.codInseminacao, tx);
            if (vinculada && !contexto.historico && (!gestacao || vinculada.codGestacao !== gestacao.codGestacao)) throw criarErro(409, "Essa inseminação já pertence a outra gestação ou a um ciclo encerrado.");
            if (vinculada && contexto.historico) {
                if (gestacao && gestacao.codGestacao !== vinculada.codGestacao) throw criarErro(400, "A inseminação e a gestação devem pertencer ao mesmo ciclo.");
                gestacao = vinculada;
                await validarCiclo(gestacao, valores.dataDiagnostico, tx);
            }
        }
        if (contexto.historico && ["dataPrevisaoParto", "dataPrevistaSecagem"].some(c => Object.hasOwn(dados, c))) throw criarErro(400, "Registro histórico não altera previsões atuais.");
        if (!contexto.historico && valores.resultado === "POSITIVO") {
            const datas = previsoes(dados, animal, inseminacao, gestacao);
            if (!gestacao) gestacao = await repository.criar("gestacoes", { ...datas, codAnimal: animal.codAnimal,
                codInseminacao: inseminacao?.codInseminacao ?? null, situacao: "EM_ANDAMENTO", dataEncerramento: null, observacao: null }, tx);
            else await repository.atualizar(gestacao, datas, tx);
            await repository.atualizar(animal, { prenha: "S" }, tx);
        } else if (!contexto.historico && valores.resultado === "NEGATIVO") {
            if (gestacao) {
                await validarEncerramento(gestacao, valores.dataDiagnostico, tx);
                await repository.atualizar(gestacao, { situacao: "ENCERRADA_NEGATIVO", dataEncerramento: valores.dataDiagnostico }, tx);
            }
            await repository.atualizar(animal, { prenha: "N" }, tx);
        }
        const registro = await repository.criar("diagnosticos", { ...valores, codGestacao: gestacao?.codGestacao ?? null,
            codInseminacao: inseminacao?.codInseminacao ?? null }, tx);
        await concluirExame(exame, tx);
        return repository.detalhes("diagnosticos", registro.codDiagnostico, tx);
    });
}

// Registrar a gestação de uma fêmea adquirida já prenhe
async function registrarGestacao(dados) {
    objeto(dados, ["codAnimal", "dataPrevisaoParto", "dataPrevistaSecagem", "observacao"]);
    const id = codigo(dados.codAnimal, "codAnimal");
    const nota = observacao(dados);
    return transacao(async tx => {
        const animal = await femea(id, null, tx);
        if (animal.prenha !== "S") throw criarErro(400, "O cadastro sem inseminação é destinado ao animal já adquirido prenhe. Para confirmar prenhez, registre um diagnóstico positivo.");
        if (await repository.gestacaoAtiva(id, tx)) throw criarErro(409, "O animal já possui gestação em andamento.");
        const gestacao = await repository.criar("gestacoes", { ...previsoes(dados, animal, null), codAnimal: id, codInseminacao: null,
            situacao: "EM_ANDAMENTO", dataEncerramento: null, observacao: nota }, tx);
        return repository.detalhes("gestacoes", gestacao.codGestacao, tx);
    });
}

// Atualizar as datas previstas e a observação da gestação
async function ajustarPrevisoes(id, dados) {
    const codGestacao = codigo(id, "codGestacao");
    objeto(dados, ["dataPrevisaoParto", "dataPrevistaSecagem", "observacao"]);
    if (!Object.keys(dados).length) throw criarErro(400, "Informe as previsões ou observação a alterar.");
    return transacao(async tx => {
        const registro = await repository.buscar("gestacoes", codGestacao, tx);
        if (!registro) throw criarErro(404, "Gestação não encontrada.");
        const animal = await femea(registro.codAnimal, null, tx);
        await obterGestacao(animal.codAnimal, codGestacao, tx);
        const inseminacao = registro.codInseminacao ? await repository.buscar("inseminacoes", registro.codInseminacao, tx) : null;
        const valores = previsoes(dados, animal, inseminacao, registro);
        if (Object.hasOwn(dados, "observacao")) valores.observacao = observacao(dados);
        await repository.atualizar(registro, valores, tx);
        return repository.detalhes("gestacoes", codGestacao, tx);
    });
}

// Registrar a perda gestacional e atualizar a prenhez quando aplicável
async function registrarPerda(id, dados) {
    const codGestacao = codigo(id, "codGestacao");
    objeto(dados, ["dataEncerramento", "observacao", "historico"]);
    const dataEncerramento = dataCivil(dados.dataEncerramento, "dataEncerramento");
    return transacao(async tx => {
        const registro = await repository.buscar("gestacoes", codGestacao, tx);
        if (!registro) throw criarErro(404, "Gestação não encontrada.");
        const animal = await femea(registro.codAnimal, dataEncerramento, tx);
        const contexto = await contextoEstado(animal, dataEncerramento, "prenha", dados, tx);
        await obterGestacao(animal.codAnimal, codGestacao, tx, contexto.historico);
        if (registro.situacao !== "EM_ANDAMENTO") throw criarErro(409, "A gestação já está encerrada.");
        await validarEncerramento(registro, dataEncerramento, tx);
        const valores = { situacao: "ENCERRADA_PERDA", dataEncerramento };
        if (Object.hasOwn(dados, "observacao")) valores.observacao = observacao(dados);
        await repository.atualizar(registro, valores, tx);
        if (!contexto.historico) await repository.atualizar(animal, { prenha: "N" }, tx);
        return repository.detalhes("gestacoes", codGestacao, tx);
    });
}

// Registrar a secagem e atualizar a lactação quando o evento é atual
async function registrarSecagem(dados) {
    objeto(dados, ["codAnimal", "codGestacao", "dataSecagem", "observacao", "historico"]);
    const valores = { codAnimal: codigo(dados.codAnimal, "codAnimal"), dataSecagem: dataCivil(dados.dataSecagem, "dataSecagem"), observacao: observacao(dados) };
    const idGestacao = codigoOpcional(dados, "codGestacao");
    return transacao(async tx => {
        const animal = await femea(valores.codAnimal, valores.dataSecagem, tx);
        const contexto = await contextoEstado(animal, valores.dataSecagem, "lactacao", dados, tx);
        if (!contexto.historico && animal.situacaoLactacao !== "EM_LACTACAO") throw criarErro(409, "A secagem exige um animal em lactação.");
        let gestacao = await obterGestacao(animal.codAnimal, idGestacao, tx, contexto.historico);
        if (gestacao && !idGestacao && gestacao.codInseminacao) {
            const origem = await repository.buscar("inseminacoes", gestacao.codInseminacao, tx);

            if (origem && valores.dataSecagem < origem.dataInseminacao) gestacao = null;
        }
        await validarCiclo(gestacao, valores.dataSecagem, tx);
        const registro = await repository.criar("secagens", { ...valores, codGestacao: gestacao?.codGestacao ?? null }, tx);
        if (!contexto.historico) await repository.atualizar(animal, { situacaoLactacao: "SECA" }, tx);
        return repository.detalhes("secagens", registro.codSecagem, tx);
    });
}

// Validar e ordenar os códigos das crias, impedindo repetições
function validarCrias(lista) {
    if (!Array.isArray(lista)) throw criarErro(400, "crias deve ser uma lista de códigos de animais cadastrados.");
    const codigos = lista.map(id => codigo(id, "codAnimalCria"));
    if (new Set(codigos).size !== codigos.length) throw criarErro(400, "Não repita crias no mesmo parto.");
    return codigos.sort((a, b) => a - b);
}

// Registrar o parto, vincula as crias e atualizar o ciclo da mãe
async function registrarParto(dados) {
    objeto(dados, ["codAnimalMae", "codGestacao", "dataParto", "observacao", "crias", "historico"]);
    const valores = { codAnimalMae: codigo(dados.codAnimalMae, "codAnimalMae"), dataParto: dataCivil(dados.dataParto, "dataParto"), observacao: observacao(dados) };
    const idGestacao = codigoOpcional(dados, "codGestacao");
    const crias = validarCrias(dados.crias === undefined ? [] : dados.crias);
    return transacao(async tx => {
        const animal = await femea(valores.codAnimalMae, valores.dataParto, tx);
        if (valores.dataParto <= animal.dataNascimento) throw criarErro(400, "A mãe deve ter nascido antes do parto.");
        const prenhez = await contextoEstado(animal, valores.dataParto, "prenha", dados, tx);
        const lactacao = await contextoEstado(animal, valores.dataParto, "lactacao", dados, tx);
        const anterior = await repository.ultimoParto(animal.codAnimal, tx);
        if ((anterior && anterior.dataParto === valores.dataParto) || await repository.partoNaData(animal.codAnimal, valores.dataParto, tx)) throw criarErro(409, "Já existe um parto nessa data. Vincule as crias ao parto existente.");
        const gestacao = await obterGestacao(animal.codAnimal, idGestacao, tx, prenhez.historico);
        if (gestacao) {
            if (gestacao.situacao !== "EM_ANDAMENTO") throw criarErro(409, "A gestação já está encerrada.");
            await validarEncerramento(gestacao, valores.dataParto, tx);
        }
        const registro = await repository.criar("partos", { ...valores, codGestacao: gestacao?.codGestacao ?? null }, tx);
        for (const id of crias) {
            if (id === animal.codAnimal) throw criarErro(400, "A mãe não pode ser sua própria cria.");
            const cria = await repository.buscarAnimal(id, tx);
            if (!cria || cria.dataNascimento !== valores.dataParto || (cria.codAnimalMae != null && cria.codAnimalMae !== animal.codAnimal)
                || (cria.codParto != null && cria.codParto !== registro.codParto)) {
                throw criarErro(400, "A cria deve existir, nascer na data do parto e não estar vinculada a outra mãe ou parto.");
            }
            await repository.atualizar(cria, { codAnimalMae: animal.codAnimal, codParto: registro.codParto }, tx);
        }
        if (gestacao) await repository.atualizar(gestacao, { situacao: "ENCERRADA_PARTO", dataEncerramento: valores.dataParto }, tx);
        const estado = { ...(!prenhez.historico ? { prenha: "N" } : {}), ...(!lactacao.historico ? { situacaoLactacao: "EM_LACTACAO" } : {}) };
        if (Object.keys(estado).length) await repository.atualizar(animal, estado, tx);
        return repository.detalhes("partos", registro.codParto, tx);
    });
}

// Listar os registros com os filtros validados
async function listar(tipo, filtros = {}) {
    const extras = tipo === "gestacoes" ? ["situacao"] : tipo === "diagnosticos" ? ["resultado"] : tipo === "inseminacoes" ? ["codReprodutor"] : [];
    objeto(filtros, ["codAnimal", "de", "ate", ...extras]);
    const valores = {};
    for (const [campo, valor] of Object.entries(filtros)) {
        if (["codAnimal", "codReprodutor"].includes(campo)) valores[campo] = codigo(valor, campo);
        else if (["de", "ate"].includes(campo)) valores[campo] = dataCivil(valor, campo, true);
        else {
            if (!(campo === "situacao" ? SITUACOES : RESULTADOS).includes(valor)) throw criarErro(400, "Filtro reprodutivo inválido.");
            valores[campo] = valor;
        }
    }
    if (valores.de && valores.ate && valores.de > valores.ate) throw criarErro(400, "O início do período deve anteceder o fim.");
    const registros = await repository.listar(tipo, valores);
    return tipo === "inseminacoes" ? registros.map(apresentarInseminacao) : registros;
}

// Buscar o registro pelo código e conferir se ele existe
async function buscarPorCod(tipo, id) {
    const registro = await repository.detalhes(tipo, codigo(id, "codigo"));
    if (!registro) throw criarErro(404, "Registro reprodutivo não encontrado.");
    return tipo === "inseminacoes" ? apresentarInseminacao(registro) : registro;
}

module.exports = { listar, buscarPorCod, registrarInseminacao, registrarDiagnostico, registrarGestacao,
    ajustarPrevisoes, registrarPerda, registrarSecagem, registrarParto, parametros: obterParametros };
