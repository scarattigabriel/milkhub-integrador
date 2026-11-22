const { UniqueConstraintError, ForeignKeyConstraintError, ValidationError } = require("sequelize");
const { criarErro } = require("./validacao");

// Converter falhas conhecidas em erros adequados para a operação
function tratarErro(erro) {
    if (erro instanceof UniqueConstraintError) return criarErro(409, "Já existe um registro com esse vínculo ou referência mensal.");
    if (erro instanceof ForeignKeyConstraintError) return criarErro(409, "O registro possui vínculos ou uma referência foi alterada. Consulte os dados.");
    if (erro instanceof ValidationError) return criarErro(400, "Os dados informados são inválidos.");
    if (["40001", "40P01"].includes(erro.original?.code)) return criarErro(409, "Houve uma alteração simultânea. Consulte os dados e tente novamente.");
    return erro;
}

module.exports = tratarErro;
