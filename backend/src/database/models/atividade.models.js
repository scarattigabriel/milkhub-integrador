const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const Atividade = sequelize.define(
    "Atividade",
    {
        codAtividade: {
            type: DataTypes.INTEGER,
            field: "cod_atividade",
            primaryKey: true,
            autoIncrement: true,
        },
        titulo: {
            type: DataTypes.STRING(150),
            field: "titulo",
            allowNull: false,
        },
        tipo: {
            type: DataTypes.STRING(50),
            field: "tipo",
            allowNull: false,
        },
        descricao: {
            type: DataTypes.TEXT,
            field: "descricao",
            allowNull: true,
        },
        dataHoraPrevista: {
            type: DataTypes.DATE,
            field: "data_hora_prevista",
            allowNull: true,
        },
        situacao: {
            type: DataTypes.STRING(30),
            field: "situacao",
            allowNull: false,
            defaultValue: "AGENDADA",
        },
        dataHoraEncerramento: {
            type: DataTypes.DATE,
            field: "data_hora_encerramento",
            allowNull: true,
        },
    },
    {
        tableName: "atividade",
        timestamps: false,
    }
);

// Definir os relacionamentos deste model com os demais models
Atividade.associate = (models) => {
    Atividade.hasMany(models.AtividadeAnimal, { foreignKey: "codAtividade", as: "participacoes" });
    Atividade.hasMany(models.UsoMedicamento, { foreignKey: "codAtividade", as: "usosMedicamento" });
};

module.exports = Atividade;
