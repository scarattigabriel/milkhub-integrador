const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const FechamentoMensal = sequelize.define("FechamentoMensal", {
    codFechamento: { type: DataTypes.INTEGER, field: "cod_fechamento", primaryKey: true, autoIncrement: true },
    mesReferencia: { type: DataTypes.SMALLINT, field: "mes_referencia", allowNull: false },
    anoReferencia: { type: DataTypes.SMALLINT, field: "ano_referencia", allowNull: false },
    valorTotalLeite: { type: DataTypes.DECIMAL(14, 2), field: "valor_total_leite", allowNull: true },
    observacao: { type: DataTypes.TEXT, field: "observacao", allowNull: true },
}, { tableName: "fechamento_mensal", timestamps: false, indexes: [{ unique: true, fields: ["mes_referencia", "ano_referencia"] }] });

// Definir os relacionamentos deste model com os demais models
FechamentoMensal.associate = models => {
    FechamentoMensal.hasMany(models.ColetaLeite, { foreignKey: "codFechamento", as: "coletas" });
    FechamentoMensal.hasOne(models.Receita, { foreignKey: "codFechamento", as: "receita" });
    FechamentoMensal.hasMany(models.Documento, { foreignKey: "codFechamento", as: "documentos" });
};

module.exports = FechamentoMensal;
