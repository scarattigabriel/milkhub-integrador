const express = require("express");
require("./database/connection");
const criarCors = require("./config/cors");
const usuarioRoutes = require("./usuario/usuario.routes");
const authRoutes = require("./auth/auth.routes");
const racaRoutes = require("./raca/raca.routes");
const animalRoutes = require("./animal/animal.routes");
const medicamentoRoutes = require("./medicamento/medicamento.routes");
const atividadeRoutes = require("./atividade/atividade.routes");
const usoMedicamentoRoutes = require("./uso-medicamento/uso-medicamento.routes");
const reprodutorRoutes = require("./reprodutor/reprodutor.routes");
const controleReprodutivoRoutes = require("./controle-reprodutivo/controle-reprodutivo.routes");
const leiteRoutes = require("./leite/leite.routes");
const financeiroRoutes = require("./financeiro/financeiro.routes");
const documentoRoutes = require("./documento/documento.routes");
const dashboardRoutes = require("./dashboard/dashboard.routes");
const tratarErros = require("./middlewares/tratar-erros");

const app = express();

app.use(criarCors());
app.use(express.json());
app.use("/auth", authRoutes);
app.use("/usuarios", usuarioRoutes);
app.use("/racas", racaRoutes);
app.use("/animais", animalRoutes);
app.use("/medicamentos", medicamentoRoutes);
app.use("/atividades", atividadeRoutes);
app.use("/usos-medicamento", usoMedicamentoRoutes);
app.use("/reprodutores", reprodutorRoutes);
app.use("/controle-reprodutivo", controleReprodutivoRoutes);
app.use("/leite", leiteRoutes);
app.use("/financeiro", financeiroRoutes);
app.use("/documentos", documentoRoutes);
app.use("/dashboard", dashboardRoutes);
app.use((req, res) => res.status(404).json({ mensagem: "Rota não encontrada." }));
app.use(tratarErros);

module.exports = app;
