const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const models = require("../src/database/models");
const { diaLocal, somarDias } = require("../src/utils/validacao");
const { obterParametros } = require("../src/config/reproducao");

const MARCA = "[DEMO]";
const SENHA_DEMO = "DemoLeite2026!";
const CONTAS = [
    { nome: "Gestor Demonstracao", login: "demo.gestor", perfil: "GESTOR" },
    { nome: "Colaborador Demonstracao", login: "demo.colaborador", perfil: "COLABORADOR" },
];

// Criar os registros fictícios e seus vínculos para demonstração
async function popularDemo(agora = new Date()) {
    if (process.env.NODE_ENV === "production") throw new Error("A carga demonstrativa é destinada ao ambiente de desenvolvimento.");
    const hoje = diaLocal(agora);
    const ano = Number(hoje.slice(0, 4)), mesAtual = Number(hoje.slice(5, 7));
    const parametros = obterParametros();
    // Calcular a data usada nos dados fictícios
    const dia = deslocamento => somarDias(hoje, deslocamento);
    // Calcular o horário usado nos dados fictícios
    const instante = horas => new Date(agora.getTime() + horas * 3600000);
    // Formatar os valores dos dados fictícios
    const dinheiro = centavos => `${centavos / 100n}.${String(centavos % 100n).padStart(2, "0")}`;

    return models.sequelize.transaction(async transaction => {
        // Impedir duas execuções concorrentes desta carga no mesmo banco
        await models.sequelize.query("SELECT pg_advisory_xact_lock(7342026)", { transaction });
        if (await models.Animal.findOne({ where: { brinco: "DEMO-001" }, transaction })) return { jaExistia: true };
        if (await models.Usuario.count({ where: { login: { [Op.in]: CONTAS.map(c => c.login) } }, transaction }) ||
            await models.Animal.count({ where: { brinco: { [Op.like]: "DEMO-%" } }, transaction })) {
            throw new Error("Há logins ou brincos reservados para a demonstração. Nenhum registro foi alterado.");
        }
        const contagens = {};
        // Inserir um registro fictício e atualizar a contagem da demonstração
        async function criar(modelo, valores) {
            const registro = await models[modelo].create(valores, { transaction });
            contagens[modelo] = (contagens[modelo] || 0) + 1;
            return registro;
        }
        for (const conta of CONTAS) {
            await criar("Usuario", { ...conta, ativo: true, senha: await bcrypt.hash(SENHA_DEMO, 12) });
        }
        const racas = [];
        for (const nome of ["Holandesa", "Jersey", "Girolando"]) racas.push(await criar("Raca", { nome: `${MARCA} ${nome}` }));
        const reprodutores = [];
        for (let i = 0; i < 2; i++) reprodutores.push(await criar("Reprodutor", {
            nome: `${MARCA} Reprodutor ${i + 1}`, numeroRegistro: `DEMO-REP-${i + 1}`, codRaca: racas[i].codRaca,
        }));
        const fornecedores = [];
        for (const nome of ["Cooperativa Campo Verde", "Agropecuária Boa Vista", "Serviços Veterinários Horizonte"]) {
            fornecedores.push(await criar("Fornecedor", { nome: `${MARCA} ${nome}`, contato: "Contato fictício para demonstração" }));
        }
        const tiposCusto = [];
        for (const nome of ["Alimentação", "Sanidade", "Energia", "Manutenção"]) tiposCusto.push(await criar("TipoCusto", { nome: `${MARCA} ${nome}` }));
        const tipoLeite = await criar("TipoReceita", { nome: `${MARCA} Venda de leite` });
        const tipoOutras = await criar("TipoReceita", { nome: `${MARCA} Outras receitas` });
        const medicamentos = [];
        for (const nome of ["Medicamento de teste A", "Medicamento de teste B", "Suplemento de teste"]) {
            medicamentos.push(await criar("Medicamento", { nome: `${MARCA} ${nome}`, descricao: "Produto fictício. Doses e carências são somente dados de teste, sem finalidade de manejo." }));
        }

        const nomes = ["Mimosa", "Estrela", "Aurora", "Brisa", "Flor", "Lua", "Pérola", "Mel", "Bonita", "Serena", "Cristal", "Vitória",
            "Amora", "Luna", "Jade", "Dália", "Pipoca", "Nina", "Sol", "Lili", "Trovão", "Valente", "Violeta", "Rosa"];
        const animais = [];
        for (let i = 0; i < nomes.length; i++) {
            const inativo = i >= 22, macho = i === 20 || i === 21;
            animais.push(await criar("Animal", {
                brinco: `DEMO-${String(i + 1).padStart(3, "0")}`, nome: nomes[i], sexo: macho ? "M" : "F",
                dataNascimento: i < 12 || inativo ? dia(-1800 - i * 25) : i < 16 ? dia(-650 - i) : dia(-90),
                situacaoRebanho: inativo ? "INATIVA" : "ATIVA",
                categoria: i < 12 || inativo ? "VACA" : i < 16 ? "NOVILHA" : macho ? "BEZERRO" : "BEZERRA",
                situacaoLactacao: i < 8 ? "EM_LACTACAO" : i < 12 || inativo ? "SECA" : "NAO_SE_APLICA",
                prenha: "N", codRaca: racas[i % racas.length].codRaca,
                dataSaida: inativo ? dia(-30 + i - 22) : null,
                tipoSaida: inativo ? (i === 22 ? "DESCARTE" : "OBITO") : null,
                motivoSaida: inativo ? `${MARCA} Saída fictícia para testar o histórico` : null,
            }));
        }

        // Criar um ciclo reprodutivo fictício com seus eventos relacionados
        async function ciclo(animal, dataInseminacao, partoPrevisto, encerramento = null) {
            const ins = await criar("Inseminacao", { codAnimal: animal.codAnimal, codReprodutor: reprodutores[0].codReprodutor,
                dataInseminacao, tipoSemen: "CONVENCIONAL", lote: "DEMO-LOTE", observacao: MARCA });
            const gestacao = await criar("Gestacao", { codAnimal: animal.codAnimal, codInseminacao: ins.codInseminacao,
                dataPrevisaoParto: partoPrevisto, dataPrevistaSecagem: somarDias(partoPrevisto, -parametros.diasAntesPartoSecagem),
                situacao: encerramento ? "ENCERRADA_PARTO" : "EM_ANDAMENTO", dataEncerramento: encerramento, observacao: MARCA });
            await criar("DiagnosticoGestacao", { codAnimal: animal.codAnimal, codInseminacao: ins.codInseminacao,
                codGestacao: gestacao.codGestacao, dataDiagnostico: somarDias(dataInseminacao, parametros.diasDiagnosticoMin),
                resultado: "POSITIVO", metodo: "Ultrassonografia", observacao: MARCA });
            return gestacao;
        }
        // Quatro partos encerrados com crias vinculadas à mãe e ao parto.
        for (let i = 0; i < 4; i++) {
            const mae = animais[i + 4], nascimento = animais[i + 16].dataNascimento;
            const gestacao = await ciclo(mae, somarDias(nascimento, -parametros.diasGestacao), nascimento, nascimento);
            await criar("Secagem", { codAnimal: mae.codAnimal, codGestacao: gestacao.codGestacao,
                dataSecagem: gestacao.dataPrevistaSecagem, observacao: MARCA });
            const parto = await criar("Parto", { codAnimalMae: mae.codAnimal, codGestacao: gestacao.codGestacao, dataParto: nascimento, observacao: MARCA });
            await animais[i + 16].update({ codAnimalMae: mae.codAnimal, codParto: parto.codParto }, { transaction });
        }
        // Gestações ativas de vacas em lactação e secas; prenhez sincronizada.
        for (const i of [0, 1, 2, 3, 8, 9, 10, 11]) {
            const ateParto = i < 4 ? 130 + i * 15 : 15 + (i - 8) * 10;
            const gestacao = await ciclo(animais[i], dia(ateParto - parametros.diasGestacao), dia(ateParto));
            await animais[i].update({ prenha: "S" }, { transaction });
            if (i >= 8) await criar("Secagem", { codAnimal: animais[i].codAnimal, codGestacao: gestacao.codGestacao,
                dataSecagem: gestacao.dataPrevistaSecagem, observacao: MARCA });
        }
        // Diagnóstico negativo e inseminação ainda aguardando confirmação.
        const negativa = await criar("Inseminacao", { codAnimal: animais[12].codAnimal, codReprodutor: reprodutores[1].codReprodutor,
            dataInseminacao: dia(-50), tipoSemen: "SEXADO", observacao: MARCA });
        await criar("DiagnosticoGestacao", { codAnimal: animais[12].codAnimal, codInseminacao: negativa.codInseminacao,
            dataDiagnostico: dia(-15), resultado: "NEGATIVO", metodo: "Ultrassonografia", observacao: MARCA });
        await criar("Inseminacao", { codAnimal: animais[13].codAnimal, codReprodutor: reprodutores[1].codReprodutor,
            dataInseminacao: dia(-20), tipoSemen: "SEXADO", observacao: MARCA });

        // Criar uma atividade fictícia e seus participantes ou aplicações
        async function atividade(titulo, tipo, horas, participantes = [], situacao = "AGENDADA") {
            const a = await criar("Atividade", { titulo: `${MARCA} ${titulo}`, tipo, descricao: "Registro fictício para teste do sistema.",
                dataHoraPrevista: instante(horas), situacao, dataHoraEncerramento: situacao === "AGENDADA" ? null : instante(horas + .25) });
            for (const animal of participantes) await criar("AtividadeAnimal", { codAtividade: a.codAtividade, codAnimal: animal.codAnimal });
            return a;
        }
        await atividade("Revisar a ordenhadeira", "TRABALHO", 1);
        await atividade("Exame de rotina", "EXAME", 2, [animais[0], animais[1]]);
        await atividade("Conferir os bebedouros", "TRABALHO", 24);
        await atividade("Diagnóstico de prenhez", "EXAME", 24 * 10, [animais[13]]);
        await atividade("Revisar cercas", "TRABALHO", -48);
        await atividade("Desaleitamento das bezerras", "DESALEITAMENTO", -24, [animais[16], animais[17]]);
        await atividade("Limpeza da sala de ordenha", "TRABALHO", -72, [], "CONCLUIDA");
        await atividade("Visita reagendada", "EXAME", -48, [animais[2]], "CANCELADA");
        for (let i = 0; i < 3; i++) {
            const a = await atividade(`Tratamento demonstrativo ${i + 1}`, "APLICACAO_MEDICAMENTO", -24 * (i === 2 ? 10 : 1), [animais[i]], "CONCLUIDA");
            const aplicacao = a.dataHoraEncerramento;
            await criar("UsoMedicamento", { codAnimal: animais[i].codAnimal, codAtividade: a.codAtividade,
                codMedicamento: medicamentos[i % 2].codMedicamento, dose: "DOSE FICTICIA", unidadeCarencia: "DIAS", valorCarencia: 4,
                dataHoraAplicacao: aplicacao, fimCarenciaLeite: new Date(aplicacao.getTime() + 4 * 86400000), observacao: MARCA });
        }
        const planejada = await atividade("Aplicação planejada", "APLICACAO_MEDICAMENTO", 48, [animais[3]]);
        await criar("UsoMedicamento", { codAnimal: animais[3].codAnimal, codAtividade: planejada.codAtividade,
            codMedicamento: medicamentos[0].codMedicamento, dose: "DOSE FICTICIA", unidadeCarencia: "DIAS", valorCarencia: 3,
            dataHoraAplicacao: null, fimCarenciaLeite: null, observacao: MARCA });

        const mesesPreservados = [];
        for (let mes = 1; mes <= mesAtual; mes++) {
            const prefixo = `${ano}-${String(mes).padStart(2, "0")}`;

            if (await models.FechamentoMensal.findOne({ where: { mesReferencia: mes, anoReferencia: ano }, transaction })) {
                mesesPreservados.push(prefixo);
                continue;
            }
            const ultimoDia = mes === mesAtual ? Number(hoje.slice(8)) - 1 : new Date(Date.UTC(ano, mes, 0)).getUTCDate();
            const fechamento = await criar("FechamentoMensal", { mesReferencia: mes, anoReferencia: ano, valorTotalLeite: null, observacao: MARCA });
            let centilitros = 0n;
            for (let d = 2; d <= ultimoDia; d += 3) {
                const volume = BigInt((480 + mes * 14 + (d * 7) % 90) * 100 + 25);
                centilitros += volume;
                await criar("ColetaLeite", { dataColeta: `${prefixo}-${String(d).padStart(2, "0")}`, horarioColeta: "08:30:00",
                    volumeLitros: dinheiro(volume), resultadoAlizarol: "ESTAVEL", codFechamento: fechamento.codFechamento, observacao: MARCA });
            }
            if (mes < mesAtual) {
                const valor = dinheiro((centilitros * BigInt(220 + mes * 3) + 50n) / 100n);
                await fechamento.update({ valorTotalLeite: valor }, { transaction });
                await criar("Receita", { dataReceita: `${prefixo}-${ultimoDia}`, descricao: `${MARCA} Recebimento do leite de ${prefixo}`,
                    valor, codTipoReceita: tipoLeite.codTipoReceita, codFechamento: fechamento.codFechamento });
            }
            // Somente lançamentos realizados, nunca datas futuras.
            for (let i = 0; i < tiposCusto.length; i++) {
                const d = Math.min(ultimoDia, 3 + i * 4);
                if (d < 1) continue;
                await criar("Custo", { dataCusto: `${prefixo}-${String(d).padStart(2, "0")}`,
                    descricao: `${MARCA} ${["Ração e concentrado", "Atendimento e insumos", "Energia da propriedade", "Reparo dos equipamentos"][i]}`,
                    valor: dinheiro(BigInt([480000, 45000, 62000, 28000][i] + mes * 1700 + i * 500)),
                    codTipoCusto: tiposCusto[i].codTipoCusto, codFornecedor: fornecedores[i % fornecedores.length].codFornecedor });
            }
        }
        // Adiantamento sem vínculo a fechamento ainda não finalizado.
        await criar("Receita", { dataReceita: dia(-1), descricao: `${MARCA} Adiantamento fictício do leite`,
            valor: "9000.00", codTipoReceita: tipoLeite.codTipoReceita });
        await criar("Receita", { dataReceita: dia(-2), descricao: `${MARCA} Venda fictícia de esterco`,
            valor: "650.00", codTipoReceita: tipoOutras.codTipoReceita });
        return { jaExistia: false, referencia: hoje, contagens, mesesPreservados };
    });
}

// Executar a carga demonstrativa e encerrar a conexão
async function executar() {
    try {
        const resultado = await popularDemo();
        console.log(JSON.stringify(resultado, null, 2));
        if (!resultado.jaExistia) console.log(`Contas de demonstração: demo.gestor e demo.colaborador. Senha de ambas: ${SENHA_DEMO}`);
    } catch (erro) {
        console.error("Carga não aplicada; a transação foi desfeita.", erro.name, erro.message);
        process.exitCode = 1;
    } finally { await models.sequelize.close(); }
}

if (require.main === module) executar();
module.exports = { popularDemo };
