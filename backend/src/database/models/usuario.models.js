const { DataTypes } = require("sequelize");
const sequelize = require("../connection");

const Usuario = sequelize.define(
	"Usuario",
	{
		codUsuario: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: "cod_usuario"
        },
		nome: {
            type: DataTypes.STRING(150),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [1, 150],
            },
        },
		login: {
            type: DataTypes.STRING(60),
            unique: true,
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [1, 60],
            },
        },
		senha: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [1, 255],
            },
        },
        ativo: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        perfil: {
            type: DataTypes.STRING(20),
            allowNull: false,
            validate: {
                isIn: {
                    args: [["GESTOR", "COLABORADOR"]],
                    msg: "Perfil de usuário não existente.",
                },
            },
        },
	},
	{
        timestamps: false,
        tableName: "usuario",
    },
);

module.exports = Usuario;
