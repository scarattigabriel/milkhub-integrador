const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const AtividadeAnimal = sequelize.define(
    "AtividadeAnimal",
    {
        codAtividade: {
            type: DataTypes.INTEGER,
            field: "cod_atividade",
            primaryKey: true,
            allowNull: false,
        },
        codAnimal: {
            type: DataTypes.INTEGER,
            field: "cod_animal",
            primaryKey: true,
            allowNull: false,
        },
    },
    {
        tableName: "atividade_animal",
        timestamps: false,
    }
);

// Definir os relacionamentos deste model com os demais models
AtividadeAnimal.associate = (models) => {
    AtividadeAnimal.belongsTo(models.Atividade, { foreignKey: "codAtividade", as: "atividade" });
    AtividadeAnimal.belongsTo(models.Animal, { foreignKey: "codAnimal", as: "animal" });
};

module.exports = AtividadeAnimal;
