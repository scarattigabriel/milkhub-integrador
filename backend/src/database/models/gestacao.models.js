const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const Gestacao = sequelize.define(
    "Gestacao",
    {
        codGestacao: {
            type: DataTypes.INTEGER,
            field: "cod_gestacao",
            primaryKey: true,
            autoIncrement: true,
        },
        dataPrevisaoParto: {
            type: DataTypes.DATEONLY,
            field: "data_previsao_parto",
            allowNull: true,
        },
        dataPrevistaSecagem: {
            type: DataTypes.DATEONLY,
            field: "data_prevista_secagem",
            allowNull: true,
        },
        situacao: {
            type: DataTypes.STRING(30),
            field: "situacao",
            allowNull: false,
        },
        dataEncerramento: {
            type: DataTypes.DATEONLY,
            field: "data_encerramento",
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
        codInseminacao: {
            type: DataTypes.INTEGER,
            field: "cod_inseminacao",
            allowNull: true,
            unique: true,
        },
    },
    {
        tableName: "gestacao",
        timestamps: false,
    }
);

// Definir os relacionamentos deste model com os demais models
Gestacao.associate = models => {
    Gestacao.belongsTo(models.Animal, { foreignKey: "codAnimal", as: "animal" });
    Gestacao.belongsTo(models.Inseminacao, { foreignKey: "codInseminacao", as: "inseminacao" });
    Gestacao.hasMany(models.DiagnosticoGestacao, { foreignKey: "codGestacao", as: "diagnosticos" });
    Gestacao.hasOne(models.Parto, { foreignKey: "codGestacao", as: "parto" });
    Gestacao.hasOne(models.Secagem, { foreignKey: "codGestacao", as: "secagem" });
};

module.exports = Gestacao;
