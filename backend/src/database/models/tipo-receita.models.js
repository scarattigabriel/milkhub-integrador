const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const TipoReceita = sequelize.define("TipoReceita", {
    codTipoReceita: { type: DataTypes.INTEGER, field: "cod_tipo_receita", primaryKey: true, autoIncrement: true },
    nome: { type: DataTypes.STRING(100), field: "nome", allowNull: false },
}, { tableName: "tipo_receita", timestamps: false });

module.exports = TipoReceita;
