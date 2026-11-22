const { Op, Transaction } = require("sequelize");
const {
    sequelize, Animal, Raca, Parto, Inseminacao, Gestacao, Secagem, DiagnosticoGestacao,
    Atividade, AtividadeAnimal, Medicamento, UsoMedicamento,
} = require("../database/models");

// Executar as alterações em conjunto e desfazer tudo se houver uma falha
async function executarEmTransacao(operacao) {
    // Evitar inconsistências entre edições simultâneas de mãe e cria
    return sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE }, operacao);
}

// Consultar os registros no banco
async function listar(filtros) {
    const { busca, ...where } = filtros;
    if (busca) {
        const texto = busca.replace(/[\\%_]/g, "\\$&");
        where[Op.or] = [
            { nome: { [Op.iLike]: `%${texto}%` } },
            { brinco: { [Op.iLike]: `%${texto}%` } },
        ];
    }
    return Animal.findAll({
        where,
        include: [{ model: Raca, as: "raca" }],
        order: [["codAnimal", "ASC"]],
    });
}

// Buscar o registro pelo código
async function buscarPorCod(codAnimal, transacao) {
    return Animal.findByPk(codAnimal, {
        transaction: transacao,
        lock: transacao ? transacao.LOCK.UPDATE : undefined,
    });
}

// Buscar o registro com seus relacionamentos
async function buscarDetalhes(codAnimal, transacao) {
    return Animal.findByPk(codAnimal, {
        transaction: transacao,
        include: [
            { model: Raca, as: "raca" },
            { model: Animal, as: "mae", attributes: ["codAnimal", "nome", "brinco"] },
            { model: Parto, as: "partoNascimento" },
        ],
    });
}

// Buscar o animal pelo brinco para conferir duplicidade
async function buscarPorBrinco(brinco, transacao) {
    return Animal.findOne({ where: { brinco }, transaction: transacao });
}

// Buscar a raça vinculada ao cadastro
async function buscarRaca(codRaca, transacao) {
    return Raca.findByPk(codRaca, { transaction: transacao });
}

// Buscar o parto informado como origem do animal
async function buscarParto(codParto, transacao) {
    return Parto.findByPk(codParto, { transaction: transacao });
}

// Listar os animais vinculados à mãe ou ao parto
async function listarCrias(codAnimalMae, transacao) {
    return Animal.findAll({ where: { codAnimalMae }, transaction: transacao });
}

// Consultar os eventos reprodutivos relacionados ao animal
async function buscarEventosReprodutivos(codAnimal, transacao) {
    const consultas = [
        [Inseminacao, "codAnimal", "dataInseminacao"],
        [Gestacao, "codAnimal", "dataEncerramento"],
        [Parto, "codAnimalMae", "dataParto"],
        [Secagem, "codAnimal", "dataSecagem"],
        [DiagnosticoGestacao, "codAnimal", "dataDiagnostico"],
    ];
    const eventos = await Promise.all(consultas.map(async ([Model, campoAnimal, campoData]) => {
        const opcoes = {
            where: { [campoAnimal]: codAnimal },
            attributes: [campoData],
            transaction: transacao,
        };
        const evento = await Model.findOne({ ...opcoes, order: [[campoData, "ASC"]] });
        const ultimo = await Model.findOne({ ...opcoes, where: { ...opcoes.where, [campoData]: { [Op.ne]: null } }, order: [[campoData, "DESC"]] });
        return evento ? { data: evento[campoData], ultimaData: ultimo?.[campoData] } : null;
    }));
    return eventos.filter(evento => evento !== null);
}

// Consultar os registros que compõem o histórico do animal
async function buscarHistorico(codAnimal, transacao) {
    const consultas = [
        ["inseminacoes", Inseminacao, "codAnimal", "dataInseminacao"],
        ["gestacoes", Gestacao, "codAnimal", "codGestacao"],
        ["partos", Parto, "codAnimalMae", "dataParto"],
        ["secagens", Secagem, "codAnimal", "dataSecagem"],
        ["diagnosticos", DiagnosticoGestacao, "codAnimal", "dataDiagnostico"],
    ];
    const resultados = await Promise.all(consultas.map(async ([grupo, Model, campo, ordem]) => [
        grupo,
        await Model.findAll({ where: { [campo]: codAnimal }, order: [[ordem, "DESC"]], transaction: transacao }),
    ]));

    const participacoes = await AtividadeAnimal.findAll({
        where: { codAnimal },
        include: [{ model: Atividade, as: "atividade" }],
        transaction: transacao,
    });
    const usosMedicamento = await UsoMedicamento.findAll({
        where: { codAnimal },
        include: [{ model: Medicamento, as: "medicamento" }],
        order: [["codUso", "DESC"]],
        transaction: transacao,
    });

    return {
        ...Object.fromEntries(resultados),
        atividades: participacoes.map(participacao => participacao.atividade),
        usosMedicamento,
    };
}

// Consultar as datas extremas das aplicações do animal
async function buscarLimitesAplicacoes(codAnimal, transacao) {
    // Consultar a ocorrência mais antiga ou recente do histórico do animal
    const consultar = ordem => UsoMedicamento.findOne({
        where: { codAnimal, dataHoraAplicacao: { [Op.ne]: null } },
        attributes: ["dataHoraAplicacao"],
        include: [{ model: Atividade, as: "atividade", attributes: [], required: true, where: { situacao: "CONCLUIDA" } }],
        order: [["dataHoraAplicacao", ordem]],
        transaction: transacao,
    });
    const [primeira, ultima] = await Promise.all([consultar("ASC"), consultar("DESC")]);
    return { primeira: primeira?.dataHoraAplicacao, ultima: ultima?.dataHoraAplicacao };
}

// Buscar a gestação em andamento do animal
function buscarGestacaoAtiva(codAnimal, transacao) {
    return Gestacao.findOne({ where: { codAnimal, situacao: "EM_ANDAMENTO" }, transaction: transacao });
}

// Consultar as datas extremas das atividades do animal
async function buscarLimitesAtividades(codAnimal, transacao) {
    // Consultar a ocorrência mais antiga ou recente do histórico do animal
    const consultar = ordem => AtividadeAnimal.findOne({
        where: { codAnimal },
        include: [{ model: Atividade, as: "atividade", required: true, attributes: ["dataHoraEncerramento"], where: { situacao: "CONCLUIDA" } }],
        order: [[{ model: Atividade, as: "atividade" }, "dataHoraEncerramento", ordem]], transaction: transacao,
    });
    const [primeira, ultima] = await Promise.all([consultar("ASC"), consultar("DESC")]);
    return { primeira: primeira?.atividade.dataHoraEncerramento, ultima: ultima?.atividade.dataHoraEncerramento };
}

// Inserir o registro no banco
async function criar(dados, transacao) {
    return Animal.create(dados, { transaction: transacao });
}

// Atualizar o registro no banco
async function atualizar(animal, dados, transacao) {
    return animal.update(dados, { transaction: transacao });
}

module.exports = {
    executarEmTransacao, listar, buscarPorCod, buscarDetalhes, buscarPorBrinco,
    buscarRaca, buscarParto, listarCrias, buscarEventosReprodutivos, buscarHistorico, buscarLimitesAplicacoes, buscarLimitesAtividades, buscarGestacaoAtiva, criar, atualizar,
};
