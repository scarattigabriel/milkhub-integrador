const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const Animal = sequelize.define(
    "Animal",
    {
        codAnimal: {
            type: DataTypes.INTEGER,
            field: "cod_animal",
            primaryKey: true,
            autoIncrement: true,
        },
        brinco: {
            type: DataTypes.STRING(30),
            field: "brinco",
            allowNull: false,
            unique: true,
        },
        nome: {
            type: DataTypes.STRING(100),
            field: "nome",
            allowNull: false,
        },
        sexo: {
            type: DataTypes.CHAR(1),
            field: "sexo",
            allowNull: false,
        },
        dataNascimento: {
            type: DataTypes.DATEONLY,
            field: "data_nascimento",
            allowNull: false,
        },
        situacaoRebanho: {
            type: DataTypes.STRING(30),
            field: "situacao_rebanho",
            allowNull: false,
        },
        categoria: {
            type: DataTypes.STRING(30),
            field: "categoria",
            allowNull: false,
        },
        situacaoLactacao: {
            type: DataTypes.STRING(30),
            field: "situacao_lactacao",
            allowNull: false,
        },
        dataSaida: {
            type: DataTypes.DATEONLY,
            field: "data_saida",
            allowNull: true,
        },
        tipoSaida: {
            type: DataTypes.STRING(30),
            field: "tipo_saida",
            allowNull: true,
        },
        motivoSaida: {
            type: DataTypes.STRING(255),
            field: "motivo_saida",
            allowNull: true,
        },
        prenha: {
            type: DataTypes.CHAR(1),
            field: "prenha",
            allowNull: false,
        },
        codRaca: {
            type: DataTypes.INTEGER,
            field: "cod_raca",
            allowNull: true,
        },
        codAnimalMae: {
            type: DataTypes.INTEGER,
            field: "cod_animal_mae",
            allowNull: true,
        },
        codParto: {
            type: DataTypes.INTEGER,
            field: "cod_parto",
            allowNull: true,
        },
    },
    {
        tableName: "animal",
        timestamps: false,
    }
);

// Definir os relacionamentos deste model com os demais models
Animal.associate = (models) => {
    Animal.belongsTo(models.Raca, { foreignKey: "codRaca", as: "raca" });
    Animal.belongsTo(models.Animal, { foreignKey: "codAnimalMae", as: "mae" });
    Animal.hasMany(models.Animal, { foreignKey: "codAnimalMae", as: "crias" });
    Animal.belongsTo(models.Parto, { foreignKey: "codParto", as: "partoNascimento" });
};

module.exports = Animal;
