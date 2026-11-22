const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const UsoMedicamento = sequelize.define(
    "UsoMedicamento",
    {
        codUso: {
            type: DataTypes.INTEGER,
            field: "cod_uso",
            primaryKey: true,
            autoIncrement: true,
        },
        dataHoraAplicacao: {
            type: DataTypes.DATE,
            field: "data_hora_aplicacao",
            allowNull: true,
        },
        dose: {
            type: DataTypes.STRING(50),
            field: "dose",
            allowNull: true,
        },
        unidadeCarencia: {
            type: DataTypes.STRING(20),
            field: "unidade_carencia",
            allowNull: true,
        },
        valorCarencia: {
            type: DataTypes.INTEGER,
            field: "valor_carencia",
            allowNull: true,
        },
        fimCarenciaLeite: {
            type: DataTypes.DATE,
            field: "fim_carencia_leite",
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
        codAtividade: {
            type: DataTypes.INTEGER,
            field: "cod_atividade",
            allowNull: false,
        },
        codMedicamento: {
            type: DataTypes.INTEGER,
            field: "cod_medicamento",
            allowNull: false,
        },
    },
    {
        tableName: "uso_medicamento",
        timestamps: false,
    }
);

// Definir os relacionamentos deste model com os demais models
UsoMedicamento.associate = (models) => {
    UsoMedicamento.belongsTo(models.Medicamento, { foreignKey: "codMedicamento", as: "medicamento" });
    UsoMedicamento.belongsTo(models.Animal, { foreignKey: "codAnimal", as: "animal" });
    UsoMedicamento.belongsTo(models.Atividade, { foreignKey: "codAtividade", as: "atividade" });
};

module.exports = UsoMedicamento;
