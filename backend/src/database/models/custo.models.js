const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const Custo = sequelize.define("Custo", {
    codCusto: { type: DataTypes.INTEGER, field: "cod_custo", primaryKey: true, autoIncrement: true },
    dataCusto: { type: DataTypes.DATEONLY, field: "data_custo", allowNull: false },
    descricao: { type: DataTypes.STRING(255), field: "descricao", allowNull: false },
    valor: { type: DataTypes.DECIMAL(12, 2), field: "valor", allowNull: false },
    codTipoCusto: { type: DataTypes.INTEGER, field: "cod_tipo_custo", allowNull: false },
    codFornecedor: { type: DataTypes.INTEGER, field: "cod_fornecedor", allowNull: true },
}, { tableName: "custo", timestamps: false });

// Definir os relacionamentos deste model com os demais models
Custo.associate = models => {
    Custo.belongsTo(models.TipoCusto, { foreignKey: "codTipoCusto", as: "tipoCusto" });
    Custo.belongsTo(models.Fornecedor, { foreignKey: "codFornecedor", as: "fornecedor" });
    Custo.hasMany(models.DocumentoCusto, { foreignKey: "codCusto", as: "documentosCusto" });
};

module.exports = Custo;
