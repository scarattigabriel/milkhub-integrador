const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const DocumentoReceita = sequelize.define("DocumentoReceita", {
    codDocumento: { type: DataTypes.INTEGER, field: "cod_documento", primaryKey: true, allowNull: false },
    codReceita: { type: DataTypes.INTEGER, field: "cod_receita", primaryKey: true, allowNull: false },
}, { tableName: "documento_receita", timestamps: false });

// Definir os relacionamentos deste model com os demais models
DocumentoReceita.associate = models => {
    DocumentoReceita.belongsTo(models.Documento, { foreignKey: "codDocumento", as: "documento" });
    DocumentoReceita.belongsTo(models.Receita, { foreignKey: "codReceita", as: "receita" });
};

module.exports = DocumentoReceita;
