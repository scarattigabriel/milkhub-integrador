const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const Documento = sequelize.define("Documento", {
    codDocumento: { type: DataTypes.INTEGER, field: "cod_documento", primaryKey: true, autoIncrement: true },
    tipoDocumento: { type: DataTypes.STRING(50), field: "tipo_documento", allowNull: true },
    nomeArquivo: { type: DataTypes.STRING(255), field: "nome_arquivo", allowNull: false },
    referenciaArquivo: { type: DataTypes.STRING(500), field: "referencia_arquivo", allowNull: false },
    dataHoraInclusao: { type: DataTypes.DATE, field: "data_hora_inclusao", allowNull: false, defaultValue: DataTypes.NOW },
    descricao: { type: DataTypes.STRING(255), field: "descricao", allowNull: true },
    codFechamento: { type: DataTypes.INTEGER, field: "cod_fechamento", allowNull: true },
}, { tableName: "documento", timestamps: false });

// Definir os relacionamentos deste model com os demais models
Documento.associate = models => {
    Documento.belongsTo(models.FechamentoMensal, { foreignKey: "codFechamento", as: "fechamento" });
    Documento.hasMany(models.DocumentoCusto, { foreignKey: "codDocumento", as: "custos" });
    Documento.hasMany(models.DocumentoReceita, { foreignKey: "codDocumento", as: "receitas" });
};

module.exports = Documento;
