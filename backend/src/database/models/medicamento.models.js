const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const Medicamento = sequelize.define(
    "Medicamento",
    {
        codMedicamento: {
            type: DataTypes.INTEGER,
            field: "cod_medicamento",
            primaryKey: true,
            autoIncrement: true,
        },
        nome: {
            type: DataTypes.STRING(150),
            field: "nome",
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [1, 150],
                // Impedir salvar um nome vazio ou composto apenas por espaços
                naoPodeSerVazio(valor) {
                    if (typeof valor !== "string" || valor.trim() === "") {
                        throw new Error("Informe o nome do medicamento.");
                    }
                },
            },
        },
        descricao: {
            type: DataTypes.TEXT,
            field: "descricao",
            allowNull: true,
            validate: {
                // Conferir se a descrição é um texto ou null
                deveSerTexto(valor) {
                    if (valor != null && typeof valor !== "string") {
                        throw new Error("A descrição deve ser um texto ou null.");
                    }
                },
            },
        },
    },
    {
        tableName: "medicamento",
        timestamps: false,
    }
);

module.exports = Medicamento;
