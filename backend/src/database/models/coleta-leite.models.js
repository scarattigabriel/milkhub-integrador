const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const ColetaLeite = sequelize.define("ColetaLeite", {
    codColeta: { type: DataTypes.INTEGER, field: "cod_coleta", primaryKey: true, autoIncrement: true },
    dataColeta: { type: DataTypes.DATEONLY, field: "data_coleta", allowNull: false },
    volumeLitros: { type: DataTypes.DECIMAL(10, 2), field: "volume_litros", allowNull: false },
    horarioColeta: { type: DataTypes.TIME, field: "horario_coleta", allowNull: true },
    observacao: { type: DataTypes.TEXT, field: "observacao", allowNull: true },
    resultadoAlizarol: { type: DataTypes.STRING(30), field: "resultado_alizarol", allowNull: true },
    codFechamento: { type: DataTypes.INTEGER, field: "cod_fechamento", allowNull: true },
}, { tableName: "coleta_leite", timestamps: false });

// Definir os relacionamentos deste model com os demais models
ColetaLeite.associate = models => {
    ColetaLeite.belongsTo(models.FechamentoMensal, { foreignKey: "codFechamento", as: "fechamento" });
};

module.exports = ColetaLeite;
