const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const Inseminacao = sequelize.define(
    "Inseminacao",
    {
        codInseminacao: {
            type: DataTypes.INTEGER,
            field: "cod_inseminacao",
            primaryKey: true,
            autoIncrement: true,
        },
        dataInseminacao: {
            type: DataTypes.DATEONLY,
            field: "data_inseminacao",
            allowNull: false,
        },
        tipoSemen: {
            type: DataTypes.STRING(50),
            field: "tipo_semen",
            allowNull: true,
        },
        lote: {
            type: DataTypes.STRING(50),
            field: "lote",
            allowNull: true,
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
        codReprodutor: {
            type: DataTypes.INTEGER,
            field: "cod_reprodutor",
            allowNull: false,
        },
    },
    {
        tableName: "inseminacao",
        timestamps: false,
    }
);

// Definir os relacionamentos deste model com os demais models
Inseminacao.associate = models => {
    Inseminacao.belongsTo(models.Animal, { foreignKey: "codAnimal", as: "animal" });
    Inseminacao.belongsTo(models.Reprodutor, { foreignKey: "codReprodutor", as: "reprodutor" });
    Inseminacao.hasMany(models.DiagnosticoGestacao, { foreignKey: "codInseminacao", as: "diagnosticos" });
};

module.exports = Inseminacao;
