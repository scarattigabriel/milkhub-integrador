const { Op, Transaction } = require("sequelize");
const { sequelize, Animal, Reprodutor, Inseminacao, DiagnosticoGestacao, Gestacao, Secagem, Parto } = require("../database/models");

const MODELS = { inseminacoes: Inseminacao, diagnosticos: DiagnosticoGestacao, gestacoes: Gestacao, secagens: Secagem, partos: Parto };
const CHAVES = { inseminacoes: "codInseminacao", diagnosticos: "codDiagnostico", gestacoes: "codGestacao", secagens: "codSecagem", partos: "codParto" };
const DATAS = { inseminacoes: "dataInseminacao", diagnosticos: "dataDiagnostico", gestacoes: "dataPrevisaoParto", secagens: "dataSecagem", partos: "dataParto" };

// Definir os relacionamentos carregados nas consultas
function relacoes(tipo) {
    const animal = { model: Animal, as: tipo === "partos" ? "mae" : "animal" };
    if (tipo === "inseminacoes") return [animal, { model: Reprodutor, as: "reprodutor" }, { model: DiagnosticoGestacao, as: "diagnosticos" }];
    if (tipo === "gestacoes") return [animal, { model: Inseminacao, as: "inseminacao" },
        { model: DiagnosticoGestacao, as: "diagnosticos" }, { model: Secagem, as: "secagem" }, { model: Parto, as: "parto" }];
    if (tipo === "diagnosticos") return [animal, { model: Inseminacao, as: "inseminacao" }, { model: Gestacao, as: "gestacao" }];
    return [animal, { model: Gestacao, as: "gestacao" }, ...(tipo === "partos" ? [{ model: Animal, as: "crias" }] : [])];
}

// Executar as alterações em conjunto e desfazer tudo se houver uma falha
function executarEmTransacao(operacao) {
    return sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE }, operacao);
}

// Buscar o animal usado na operação
function buscarAnimal(codAnimal, transacao) {
    return Animal.findByPk(codAnimal, { transaction: transacao, lock: transacao.LOCK.UPDATE });
}
// Buscar o registro de reprodutor
function buscarReprodutor(id, transacao) { return Reprodutor.findByPk(id, { transaction: transacao }); }
// Buscar o registro pelo código informado
function buscar(tipo, id, transacao) { return MODELS[tipo].findByPk(id, { transaction: transacao }); }
// Buscar o registro com seus relacionamentos
function detalhes(tipo, id, transacao) { return MODELS[tipo].findByPk(id, { transaction: transacao, include: relacoes(tipo) }); }
// Inserir o registro no banco
function criar(tipo, dados, transacao) { return MODELS[tipo].create(dados, { transaction: transacao }); }
// Atualizar o registro no banco
function atualizar(registro, dados, transacao) { return registro.update(dados, { transaction: transacao }); }

// Consultar os registros no banco
function listar(tipo, filtros) {
    const { de, ate, codAnimal, ...where } = filtros;
    if (codAnimal) where[tipo === "partos" ? "codAnimalMae" : "codAnimal"] = codAnimal;
    if (de || ate) where[DATAS[tipo]] = { ...(de ? { [Op.gte]: de } : {}), ...(ate ? { [Op.lte]: ate } : {}) };
    return MODELS[tipo].findAll({ where, include: relacoes(tipo), order: [[CHAVES[tipo], "DESC"]] });
}

// Buscar a gestação em andamento do animal
function gestacaoAtiva(codAnimal, transacao) {
    return Gestacao.findOne({ where: { codAnimal, situacao: "EM_ANDAMENTO" }, transaction: transacao });
}
// Buscar a gestação vinculada à inseminação
function gestacaoDaInseminacao(codInseminacao, transacao) {
    return Gestacao.findOne({ where: { codInseminacao }, transaction: transacao });
}
// Buscar a inseminação mais recente do animal
function ultimaInseminacao(codAnimal, transacao) {
    return Inseminacao.findOne({ where: { codAnimal }, order: [["dataInseminacao", "DESC"], ["codInseminacao", "DESC"]], transaction: transacao });
}
// Buscar o parto mais recente da mãe
function ultimoParto(codAnimalMae, transacao) {
    return Parto.findOne({ where: { codAnimalMae }, order: [["dataParto", "DESC"]], transaction: transacao });
}

// Verificar se a mãe já possui parto registrado na data informada
function partoNaData(codAnimalMae, dataParto, transacao) {
    return Parto.findOne({ where: { codAnimalMae, dataParto }, transaction: transacao });
}

// Consultar a última data de alteração do estado reprodutivo do animal
async function ultimaDataEstado(codAnimal, estado, transacao) {
    const consultas = estado === "lactacao"
        ? [[Secagem, "codAnimal", "dataSecagem", {}], [Parto, "codAnimalMae", "dataParto", {}]]
        : [[DiagnosticoGestacao, "codAnimal", "dataDiagnostico", { resultado: { [Op.in]: ["POSITIVO", "NEGATIVO"] } }],
            [Parto, "codAnimalMae", "dataParto", {}], [Gestacao, "codAnimal", "dataEncerramento", {}]];
    const datas = await Promise.all(consultas.map(async ([Model, campo, data, extra]) => {
        const registro = await Model.findOne({ where: { [campo]: codAnimal, [data]: { [Op.ne]: null }, ...extra },
            attributes: [data], order: [[data, "DESC"]], transaction: transacao });
        return registro?.[data];
    }));
    return datas.filter(Boolean).sort().at(-1);
}

// Consultar a data mais recente dos eventos da gestação
async function ultimaDataDaGestacao(codGestacao, transacao) {
    const consultas = [[DiagnosticoGestacao, "dataDiagnostico"], [Secagem, "dataSecagem"], [Parto, "dataParto"]];
    const datas = await Promise.all(consultas.map(async ([Model, campo]) => {
        const registro = await Model.findOne({ where: { codGestacao }, attributes: [campo], order: [[campo, "DESC"]], transaction: transacao });
        return registro?.[campo];
    }));
    return datas.filter(Boolean).sort().at(-1);
}

// Consultar a última ocorrência do tipo de evento informado
async function ultimaDataEvento(codAnimal, transacao) {
    const consultas = [[Inseminacao, "codAnimal", "dataInseminacao"], [DiagnosticoGestacao, "codAnimal", "dataDiagnostico"],
        [Secagem, "codAnimal", "dataSecagem"], [Parto, "codAnimalMae", "dataParto"], [Gestacao, "codAnimal", "dataEncerramento"]];
    const datas = await Promise.all(consultas.map(async ([Model, campo, data]) => {
        const registro = await Model.findOne({ where: { [campo]: codAnimal, [data]: { [Op.ne]: null } },
            attributes: [data], order: [[data, "DESC"]], transaction: transacao });
        return registro?.[data];
    }));
    return datas.filter(Boolean).sort().at(-1);
}

module.exports = { executarEmTransacao, buscarAnimal, buscarReprodutor, buscar, detalhes, criar, atualizar,
    listar, gestacaoAtiva, gestacaoDaInseminacao, ultimaInseminacao, ultimoParto, partoNaData, ultimaDataEvento, ultimaDataEstado, ultimaDataDaGestacao };
