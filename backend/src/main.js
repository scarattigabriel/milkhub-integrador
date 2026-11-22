const sequelize = require("./database/connection");
const app = require("./app");
const { obterParametros } = require("./config/reproducao");
const PORT = Number(process.env.PORT || 3001);

// Conectar ao banco e iniciar o servidor HTTP
async function iniciarServidor() {
    try {
        obterParametros();
        await sequelize.authenticate();

        app.listen(PORT, () => {
            console.log(`Servidor rodando em http://localhost:${PORT}`);
        });
    } catch (erro) {
        console.error("Erro ao iniciar servidor:", erro.message);
        process.exitCode = 1;
        await sequelize.close();
    }
}

if (require.main === module) iniciarServidor();

module.exports = { app, iniciarServidor };
