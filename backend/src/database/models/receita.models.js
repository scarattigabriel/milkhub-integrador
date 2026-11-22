const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const Receita = sequelize.define("Receita", {
    codReceita: { type: DataTypes.INTEGER, field: "cod_receita", primaryKey: true, autoIncrement: true },
    dataReceita: { type: DataTypes.DATEONLY, field: "data_receita", allowNull: false },
    descricao: { type: DataTypes.STRING(255), field: "descricao", allowNull: false },
    valor: { type: DataTypes.DECIMAL(12, 2), field: "valor", allowNull: false },
    codTipoReceita: { type: DataTypes.INTEGER, field: "cod_tipo_receita", allowNull: false },
    codFechamento: { type: DataTypes.INTEGER, field: "cod_fechamento", allowNull: true, unique: true },
}, { tableName: "receita", timestamps: false });

// Definir os relacionamentos deste model com os demais models
Receita.associate = models => {
    Receita.belongsTo(models.TipoReceita, { foreignKey: "codTipoReceita", as: "tipoReceita" });
    Receita.belongsTo(models.FechamentoMensal, { foreignKey: "codFechamento", as: "fechamento" });
    Receita.hasMany(models.DocumentoReceita, { foreignKey: "codReceita", as: "documentosReceita" });
};

module.exports = Receita;
