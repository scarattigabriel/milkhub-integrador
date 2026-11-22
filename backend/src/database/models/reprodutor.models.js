const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const Reprodutor = sequelize.define("Reprodutor", {
    codReprodutor: { type: DataTypes.INTEGER, field: "cod_reprodutor", primaryKey: true, autoIncrement: true },
    numeroRegistro: { type: DataTypes.STRING(60), field: "numero_registro", allowNull: true, unique: true },
    nome: { type: DataTypes.STRING(150), field: "nome", allowNull: false },
    codRaca: { type: DataTypes.INTEGER, field: "cod_raca", allowNull: true },
}, { tableName: "reprodutor", timestamps: false });

// Definir os relacionamentos deste model com os demais models
Reprodutor.associate = models => {
    Reprodutor.belongsTo(models.Raca, { foreignKey: "codRaca", as: "raca" });
};

module.exports = Reprodutor;
