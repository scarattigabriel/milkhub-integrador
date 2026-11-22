const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const Fornecedor = sequelize.define("Fornecedor", {
    codFornecedor: { type: DataTypes.INTEGER, field: "cod_fornecedor", primaryKey: true, autoIncrement: true },
    nome: { type: DataTypes.STRING(150), field: "nome", allowNull: false },
    contato: { type: DataTypes.STRING(150), field: "contato", allowNull: true },
}, { tableName: "fornecedor", timestamps: false });

module.exports = Fornecedor;
