const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const Raca = sequelize.define(
    "Raca",
    {
        codRaca: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "cod_raca",
        },
        nome: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [1, 100],
            },
        },
    },
    {
        timestamps: false,
        tableName: "raca",
    }
);

module.exports = Raca;
