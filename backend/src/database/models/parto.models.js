const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const Parto = sequelize.define(
    "Parto",
    {
        codParto: {
            type: DataTypes.INTEGER,
            field: "cod_parto",
            primaryKey: true,
            autoIncrement: true,
        },
        dataParto: {
            type: DataTypes.DATEONLY,
            field: "data_parto",
            allowNull: false,
        },
        observacao: {
            type: DataTypes.TEXT,
            field: "observacao",
            allowNull: true,
        },
        codAnimalMae: {
            type: DataTypes.INTEGER,
            field: "cod_animal_mae",
            allowNull: false,
        },
        codGestacao: {
            type: DataTypes.INTEGER,
            field: "cod_gestacao",
            allowNull: true,
            unique: true,
        },
    },
    {
        tableName: "parto",
        timestamps: false,
    }
);

// Definir os relacionamentos deste model com os demais models
Parto.associate = models => {
    Parto.belongsTo(models.Animal, { foreignKey: "codAnimalMae", as: "mae" });
    Parto.belongsTo(models.Gestacao, { foreignKey: "codGestacao", as: "gestacao" });
    Parto.hasMany(models.Animal, { foreignKey: "codParto", as: "crias" });
};

module.exports = Parto;
