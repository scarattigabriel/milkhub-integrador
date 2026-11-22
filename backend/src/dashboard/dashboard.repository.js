const { Op, Transaction } = require("sequelize");
const { sequelize, Animal, ColetaLeite, FechamentoMensal, Atividade, AtividadeAnimal, Gestacao } = require("../database/models");
const financeiroRepository = require("../financeiro/financeiro.repository");
const usoRepository = require("../uso-medicamento/uso-medicamento.repository");

// Consultar e organizar os dados necessários ao dashboard
function consultar(consulta, perfil) {
    return sequelize.transaction({ isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ, readOnly: true }, async tx => {
        const ondeAgenda = { situacao: "AGENDADA", dataHoraPrevista: { [Op.between]: [consulta.inicioAgenda, consulta.fimAgenda] } };
        const ondePendentes = { situacao: "AGENDADA", dataHoraPrevista: { [Op.lt]: consulta.agora } };
        const ondeHoje = { situacao: "AGENDADA", dataHoraPrevista: { [Op.between]: [consulta.inicioHoje, consulta.fimHoje] } };
        const participantes = [{ model: AtividadeAnimal, as: "participacoes", include: [{ model: Animal, as: "animal", attributes: ["codAnimal", "nome", "brinco"] }] }];
        const [animais, coletasAno, fechamento, agenda, totalAgenda, pendentes, totalPendentes, carencias, previsoes, financeiro, hoje, totalHoje, porSituacao] = await Promise.all([
            Animal.findAll({ attributes: ["situacaoRebanho", "categoria", "situacaoLactacao", "prenha"], transaction: tx }),
            ColetaLeite.findAll({ where: { dataColeta: { [Op.between]: [`${consulta.periodo.de.slice(0, 4)}-01-01`, `${consulta.periodo.de.slice(0, 4)}-12-31`] } },
                attributes: ["codColeta", "dataColeta", "volumeLitros"], transaction: tx }),
            FechamentoMensal.findOne({ where: { mesReferencia: consulta.periodo.mes, anoReferencia: consulta.periodo.ano }, transaction: tx }),
            Atividade.findAll({ where: ondeAgenda, include: participantes, order: [["dataHoraPrevista", "ASC"], ["codAtividade", "ASC"]], limit: 100, transaction: tx }),
            Atividade.count({ where: ondeAgenda, transaction: tx }),
            Atividade.findAll({ where: ondePendentes, include: participantes, order: [["dataHoraPrevista", "ASC"], ["codAtividade", "ASC"]], limit: 20, transaction: tx }),
            Atividade.count({ where: ondePendentes, transaction: tx }),
            usoRepository.listarCarencias(consulta.agora, undefined, tx),
            Gestacao.findAll({ where: { situacao: "EM_ANDAMENTO" }, include: [{ model: Animal, as: "animal", required: true, where: { situacaoRebanho: "ATIVA" } }],
                order: [["dataPrevisaoParto", "ASC"], ["codGestacao", "ASC"]], limit: 20, transaction: tx }),
            perfil === "GESTOR" ? financeiroRepository.dadosResumo(consulta.periodo, tx) : Promise.resolve(null),
            Atividade.findAll({ where: ondeHoje, include: participantes, order: [["dataHoraPrevista", "ASC"], ["codAtividade", "ASC"]], limit: 20, transaction: tx }),
            Atividade.count({ where: ondeHoje, transaction: tx }),
            Atividade.count({ where: { dataHoraPrevista: { [Op.between]: [consulta.inicioAgenda, consulta.fimAgenda] } }, group: ["situacao"], transaction: tx }),
        ]);
        return { animais, coletasAno, fechamento, agenda, totalAgenda, pendentes, totalPendentes, carencias, previsoes, financeiro, hoje, totalHoje,
            porSituacao: porSituacao.map(item => ({ situacao: item.situacao, quantidade: Number(item.count) })) };
    });
}

module.exports = { consultar };
