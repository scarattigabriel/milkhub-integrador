const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const DiagnosticoGestacao = sequelize.define(
    "DiagnosticoGestacao",
    {
        codDiagnostico: {
            type: DataTypes.INTEGER,
            field: "cod_diagnostico",
            primaryKey: true,
            autoIncrement: true,
        },
        resultado: {
            type: DataTypes.STRING(30),
            field: "resultado",
            allowNull: false,
        },
        metodo: {
            type: DataTypes.STRING(50),
            field: "metodo",
            allowNull: false,
        },
        dataDiagnostico: {
            type: DataTypes.DATEONLY,
            field: "data_diagnostico",
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
        codInseminacao: {
            type: DataTypes.INTEGER,
            field: "cod_inseminacao",
            allowNull: true,
        },
        codGestacao: {
            type: DataTypes.INTEGER,
            field: "cod_gestacao",
            allowNull: true,
        },
    },
    {
        tableName: "diagnostico_gestacao",
        timestamps: false,
    }
);

// Definir os relacionamentos deste model com os demais models
DiagnosticoGestacao.associate = models => {
    DiagnosticoGestacao.belongsTo(models.Animal, { foreignKey: "codAnimal", as: "animal" });
    DiagnosticoGestacao.belongsTo(models.Inseminacao, { foreignKey: "codInseminacao", as: "inseminacao" });
    DiagnosticoGestacao.belongsTo(models.Gestacao, { foreignKey: "codGestacao", as: "gestacao" });
};

module.exports = DiagnosticoGestacao;
