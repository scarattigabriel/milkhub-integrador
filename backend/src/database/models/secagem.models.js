const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const Secagem = sequelize.define(
    "Secagem",
    {
        codSecagem: {
            type: DataTypes.INTEGER,
            field: "cod_secagem",
            primaryKey: true,
            autoIncrement: true,
        },
        dataSecagem: {
            type: DataTypes.DATEONLY,
            field: "data_secagem",
            allowNull: false,
        },
        observacao: {
            type: DataTypes.TEXT,
            field: "observacao",
            allowNull: true,
        },
        codAnimal: {
            type: DataTypes.INTEGER,
            field: "cod_animal",
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
        tableName: "secagem",
        timestamps: false,
    }
);

// Definir os relacionamentos deste model com os demais models
Secagem.associate = models => {
    Secagem.belongsTo(models.Animal, { foreignKey: "codAnimal", as: "animal" });
    Secagem.belongsTo(models.Gestacao, { foreignKey: "codGestacao", as: "gestacao" });
};

module.exports = Secagem;
