const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const DocumentoCusto = sequelize.define("DocumentoCusto", {
    codDocumento: { type: DataTypes.INTEGER, field: "cod_documento", primaryKey: true, allowNull: false },
    codCusto: { type: DataTypes.INTEGER, field: "cod_custo", primaryKey: true, allowNull: false },
}, { tableName: "documento_custo", timestamps: false });

// Definir os relacionamentos deste model com os demais models
DocumentoCusto.associate = models => {
    DocumentoCusto.belongsTo(models.Documento, { foreignKey: "codDocumento", as: "documento" });
    DocumentoCusto.belongsTo(models.Custo, { foreignKey: "codCusto", as: "custo" });
};

module.exports = DocumentoCusto;
