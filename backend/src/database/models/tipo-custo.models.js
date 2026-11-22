const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const TipoCusto = sequelize.define("TipoCusto", {
    codTipoCusto: { type: DataTypes.INTEGER, field: "cod_tipo_custo", primaryKey: true, autoIncrement: true },
    nome: { type: DataTypes.STRING(100), field: "nome", allowNull: false },
}, { tableName: "tipo_custo", timestamps: false });

module.exports = TipoCusto;
