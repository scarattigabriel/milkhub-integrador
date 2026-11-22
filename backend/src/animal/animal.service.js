const { UniqueConstraintError, ForeignKeyConstraintError, ValidationError } = require("sequelize");
const animalRepository = require("./animal.repository");
const { diaLocal } = require("../utils/validacao");

const CAMPOS = [
    "brinco", "nome", "sexo", "dataNascimento", "situacaoRebanho", "categoria",
    "situacaoLactacao", "prenha", "dataSaida", "tipoSaida", "motivoSaida",
    "codRaca", "codAnimalMae", "codParto",
];
const OBRIGATORIOS = ["brinco", "nome", "sexo", "dataNascimento", "situacaoRebanho", "categoria", "situacaoLactacao", "prenha"];
const OPCIONAIS = ["dataSaida", "tipoSaida", "motivoSaida", "codRaca", "codAnimalMae", "codParto"];
const DOMINIOS = {
    sexo: ["F", "M"],
    situacaoRebanho: ["ATIVA", "INATIVA"],
    situacaoLactacao: ["EM_LACTACAO", "SECA", "NAO_SE_APLICA"],
    prenha: ["S", "N"],
    tipoSaida: ["DESCARTE", "OBITO"],
};

// Criar um erro com mensagem e status HTTP para interromper a operação
function criarErro(status, mensagem) {
    const erro = new Error(mensagem);
    erro.status = status;
    return erro;
}

// Conferir se o código é um inteiro positivo válido
function validarCodigo(valor, campo = "codAnimal") {
    if (
        !["string", "number"].includes(typeof valor) ||
        !/^[1-9]\d*$/.test(String(valor)) || Number(valor) > 2147483647
    ) {
        throw criarErro(400, `${campo} deve ser um inteiro positivo válido.`);
    }
    return Number(valor);
}

// Obter a data de hoje no horário de Brasília
function dataAtual() {
    const partes = new Intl.DateTimeFormat("en", {
        timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(new Date());
    const valores = Object.fromEntries(partes.map(parte => [parte.type, parte.value]));
    return `${valores.year}-${valores.month}-${valores.day}`;
}

// Conferir se a data existe e não está no futuro
function validarData(valor, campo) {
    if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor) || Number(valor.slice(0, 4)) < 1) {
        throw criarErro(400, `${campo} deve ser uma data no formato AAAA-MM-DD.`);
    }
    const data = new Date(`${valor}T00:00:00.000Z`);
    if (Number.isNaN(data.getTime()) || data.toISOString().slice(0, 10) !== valor) {
        throw criarErro(400, `${campo} contém uma data inexistente.`);
    }
    if (valor > dataAtual()) {
        throw criarErro(400, `${campo} não pode ser uma data futura.`);
    }
}

// Conferir e normalizar os campos enviados para a operação
function validarDados(dados, parcial = false) {
    if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
        throw criarErro(400, "Informe os dados do animal em um objeto JSON.");
    }
    if (Object.keys(dados).length === 0 || Object.keys(dados).some(campo => !CAMPOS.includes(campo))) {
        throw criarErro(400, "Informe campos válidos do animal. O código é gerado pelo banco.");
    }
    if (!parcial) {
        for (const campo of OBRIGATORIOS) {
            if (!Object.hasOwn(dados, campo)) throw criarErro(400, `Informe ${campo}.`);
        }
    }

    const valores = { ...dados };
    if (!parcial) {
        for (const campo of OPCIONAIS) {
            if (!Object.hasOwn(valores, campo)) valores[campo] = null;
        }
    }

    for (const [campo, limite] of [["brinco", 30], ["nome", 100], ["categoria", 30], ["motivoSaida", 255]]) {
        if (!Object.hasOwn(valores, campo)) continue;
        if (campo === "motivoSaida" && valores[campo] === null) continue;
        if (typeof valores[campo] !== "string" || valores[campo].trim() === "") {
            throw criarErro(400, `${campo} deve ser um texto não vazio.`);
        }
        valores[campo] = valores[campo].trim();
        if (valores[campo].length > limite) {
            throw criarErro(400, `${campo} deve ter no máximo ${limite} caracteres.`);
        }
    }
    for (const [campo, permitidos] of Object.entries(DOMINIOS)) {
        if (!Object.hasOwn(valores, campo)) continue;
        if (campo === "tipoSaida" && valores[campo] === null) continue;
        if (!permitidos.includes(valores[campo])) {
            throw criarErro(400, `Valor inválido para ${campo}. Valores aceitos: ${permitidos.join(", ")}.`);
        }
    }
    for (const campo of ["dataNascimento", "dataSaida"]) {
        if (!Object.hasOwn(valores, campo)) continue;
        if (campo === "dataSaida" && valores[campo] === null) continue;
        validarData(valores[campo], campo);
    }
    for (const campo of ["codRaca", "codAnimalMae", "codParto"]) {
        if (Object.hasOwn(valores, campo) && valores[campo] !== null) {
            valores[campo] = validarCodigo(valores[campo], campo);
        }
    }
    return valores;
}

// Conferir se combinam sexo, prenhez, lactação e saída do animal
function validarSituacao(animal) {
    if (animal.sexo === "M" && (animal.prenha !== "N" || animal.situacaoLactacao !== "NAO_SE_APLICA")) {
        throw criarErro(400, "Machos devem ter prenha N e lactação NAO_SE_APLICA.");
    }
    const camposSaida = [animal.dataSaida, animal.tipoSaida, animal.motivoSaida];
    if (animal.situacaoRebanho === "ATIVA" && camposSaida.some(valor => valor != null)) {
        throw criarErro(400, "Animal ativo deve permanecer sem dados de saída.");
    }
    if (animal.situacaoRebanho === "INATIVA" && camposSaida.some(valor => valor == null)) {
        throw criarErro(400, "Informe data, tipo e motivo da saída para o animal inativo.");
    }
    if (animal.dataSaida && animal.dataSaida < animal.dataNascimento) {
        throw criarErro(400, "A saída não pode ser anterior ao nascimento.");
    }
}

// Conferir raça, mãe e parto vinculados ao animal
async function validarVinculos(animal, transacao) {
    if (animal.codRaca !== null && !await animalRepository.buscarRaca(animal.codRaca, transacao)) {
        throw criarErro(400, "A raça informada não existe.");
    }
    if (animal.codParto !== null) {
        const parto = await animalRepository.buscarParto(animal.codParto, transacao);
        if (!parto) throw criarErro(400, "O parto informado não existe.");
        if (animal.dataNascimento !== parto.dataParto) {
            throw criarErro(400, "O nascimento deve ocorrer na data do parto vinculado.");
        }
        if (animal.codAnimalMae !== null && animal.codAnimalMae !== parto.codAnimalMae) {
            throw criarErro(400, "A mãe informada difere da mãe do parto vinculado.");
        }

        animal.codAnimalMae = parto.codAnimalMae;
    }
    if (animal.codAnimalMae !== null) {
        if (animal.codAnimalMae === animal.codAnimal) {
            throw criarErro(400, "O animal não pode ser a própria mãe.");
        }
        const mae = await animalRepository.buscarPorCod(animal.codAnimalMae, transacao);
        if (!mae) throw criarErro(400, "A mãe informada não existe.");
        if (mae.sexo !== "F" || mae.dataNascimento >= animal.dataNascimento) {
            throw criarErro(400, "A mãe deve ser fêmea e ter nascido antes da cria.");
        }
    }
}

// Impedir mudanças que contradizem eventos já registrados para o animal
async function validarHistorico(animal, transacao) {
    const crias = await animalRepository.listarCrias(animal.codAnimal, transacao);
    if (crias.some(cria => animal.sexo !== "F" || cria.dataNascimento <= animal.dataNascimento)) {
        throw criarErro(400, "A alteração é incompatível com as crias vinculadas ao animal.");
    }
    const eventos = await animalRepository.buscarEventosReprodutivos(animal.codAnimal, transacao);
    if (eventos.length && animal.sexo !== "F") {
        throw criarErro(400, "O animal possui eventos reprodutivos e deve permanecer do sexo feminino.");
    }
    if (eventos.some(evento => evento.data && evento.data < animal.dataNascimento)) {
        throw criarErro(400, "O nascimento não pode ser posterior aos eventos reprodutivos registrados.");
    }
    if (animal.dataSaida && eventos.some(evento => (evento.ultimaData || evento.data) > animal.dataSaida)) {
        throw criarErro(400, "A saída não pode anteceder os eventos reprodutivos registrados.");
    }
    const limites = await animalRepository.buscarLimitesAplicacoes(animal.codAnimal, transacao);
    if ((limites.primeira && animal.dataNascimento > diaLocal(limites.primeira))
        || (limites.ultima && animal.dataSaida && animal.dataSaida < diaLocal(limites.ultima))) {
        throw criarErro(400, "O nascimento e a saída devem preservar as datas das aplicações já realizadas.");
    }
    const atividades = await animalRepository.buscarLimitesAtividades(animal.codAnimal, transacao);
    if ((atividades.primeira && animal.dataNascimento > diaLocal(atividades.primeira))
        || (atividades.ultima && animal.dataSaida && animal.dataSaida < diaLocal(atividades.ultima))) {
        throw criarErro(400, "O nascimento e a saída devem preservar as datas das atividades já concluídas.");
    }
}

// Converter falhas conhecidas em erros adequados para a operação
function tratarErro(erro) {
    if (erro instanceof UniqueConstraintError) return criarErro(409, "O brinco já está cadastrado.");
    if (erro instanceof ForeignKeyConstraintError) return criarErro(400, "A raça, mãe ou parto informado não existe ou foi alterado.");
    if (erro instanceof ValidationError) return criarErro(400, "Os dados do animal são inválidos.");
    if (["40001", "40P01"].includes(erro.original?.code)) {
        return criarErro(409, "Houve uma alteração simultânea. Consulte os dados e tente novamente.");
    }
    return erro;
}

// Listar os registros com os filtros validados
async function listar(filtros = {}) {
    const permitidos = ["busca", "sexo", "situacaoRebanho", "categoria", "situacaoLactacao", "prenha", "codRaca"];
    if (!filtros || typeof filtros !== "object" || Array.isArray(filtros) || Object.keys(filtros).some(campo => !permitidos.includes(campo))) {
        throw criarErro(400, "Filtros de consulta inválidos.");
    }
    const valores = {};
    for (const [campo, valor] of Object.entries(filtros)) {
        if (typeof valor !== "string") throw criarErro(400, `Filtro ${campo} inválido.`);
        const texto = valor.trim();
        if (texto === "") continue;
        if (campo === "busca" || campo === "categoria") {
            const limite = campo === "busca" ? 100 : 30;
            if (texto.length > limite) throw criarErro(400, `Filtro ${campo} deve ter no máximo ${limite} caracteres.`);
            valores[campo] = texto;
        } else if (campo === "codRaca") {
            valores.codRaca = validarCodigo(texto, campo);
        } else {
            if (!DOMINIOS[campo].includes(texto)) throw criarErro(400, `Filtro ${campo} inválido.`);
            valores[campo] = texto;
        }
    }
    return animalRepository.listar(valores);
}

// Buscar o registro pelo código e conferir se ele existe
async function buscarPorCod(codAnimal) {
    const animal = await animalRepository.buscarDetalhes(validarCodigo(codAnimal));
    if (!animal) throw criarErro(404, "Animal não encontrado.");
    return animal;
}

// Validar os dados e cadastrar o registro
async function criar(dados) {
    const valores = validarDados(dados);
    validarSituacao(valores);
    try {
        return await animalRepository.executarEmTransacao(async transacao => {
            const existente = await animalRepository.buscarPorBrinco(valores.brinco, transacao);
            if (existente) throw criarErro(409, "O brinco já está cadastrado.");
            await validarVinculos(valores, transacao);
            return animalRepository.criar(valores, transacao);
        });
    } catch (erro) {
        throw tratarErro(erro);
    }
}

// Validar as alterações e atualizar o registro
async function atualizar(codAnimal, dados) {
    const codigo = validarCodigo(codAnimal);
    const valores = validarDados(dados, true);
    try {
        return await animalRepository.executarEmTransacao(async transacao => {
            const atual = await animalRepository.buscarPorCod(codigo, transacao);
            if (!atual) throw criarErro(404, "Animal não encontrado.");
            const completo = { ...atual.get({ plain: true }), ...valores };
            validarSituacao(completo);
            if (completo.prenha === "N" && atual.prenha !== "N"
                && await animalRepository.buscarGestacaoAtiva(codigo, transacao)) {
                throw criarErro(409, "O animal possui gestação em andamento. Registre diagnóstico negativo, parto ou perda pelo controle reprodutivo.");
            }
            if (Object.hasOwn(valores, "brinco")) {
                const existente = await animalRepository.buscarPorBrinco(valores.brinco, transacao);
                if (existente && existente.codAnimal !== codigo) throw criarErro(409, "O brinco já está cadastrado.");
            }
            await validarVinculos(completo, transacao);
            if (completo.sexo !== atual.sexo || completo.dataNascimento !== atual.dataNascimento
                || completo.dataSaida !== atual.dataSaida) {
                await validarHistorico(completo, transacao);
            }
            // Incluir a mãe obtida de um parto conhecido, quando aplicável
            return animalRepository.atualizar(atual, { ...valores, codAnimalMae: completo.codAnimalMae }, transacao);
        });
    } catch (erro) {
        throw tratarErro(erro);
    }
}

// Registrar descarte ou óbito e manter o histórico do animal
async function registrarSaida(codAnimal, dados) {
    const campos = ["dataSaida", "tipoSaida", "motivoSaida"];
    if (!dados || typeof dados !== "object" || Array.isArray(dados)
        || Object.keys(dados).some(campo => !campos.includes(campo))
        || campos.some(campo => !Object.hasOwn(dados, campo) || dados[campo] === null)) {
        throw criarErro(400, "Informe somente dataSaida, tipoSaida e motivoSaida para registrar a saída.");
    }
    return atualizar(codAnimal, { ...dados, situacaoRebanho: "INATIVA" });
}

// Consultar os registros que compõem o histórico do animal
async function buscarHistorico(codAnimal) {
    const codigo = validarCodigo(codAnimal);
    try {
        return await animalRepository.executarEmTransacao(async transacao => {
            const animal = await animalRepository.buscarDetalhes(codigo, transacao);
            if (!animal) throw criarErro(404, "Animal não encontrado.");
            const historico = await animalRepository.buscarHistorico(codigo, transacao);
            return { animal, ...historico };
        });
    } catch (erro) {
        throw tratarErro(erro);
    }
}

module.exports = { listar, buscarPorCod, criar, atualizar, registrarSaida, buscarHistorico };
