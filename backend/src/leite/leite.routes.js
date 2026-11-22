const express = require("express");
const controller = require("./leite.controller");
const autenticar = require("../middlewares/autenticar");
const autorizar = require("../middlewares/autorizar");

const router = express.Router();
router.use(autenticar);

router.get("/coletas", autorizar("GESTOR", "COLABORADOR"), controller.listarColetas);
router.get("/coletas/:codigo", autorizar("GESTOR", "COLABORADOR"), controller.buscarColeta);
router.post("/coletas", autorizar("GESTOR"), controller.criarColeta);
router.patch("/coletas/:codigo", autorizar("GESTOR"), controller.atualizarColeta);
router.delete("/coletas/:codigo", autorizar("GESTOR"), controller.deletarColeta);
router.get("/fechamentos", autorizar("GESTOR", "COLABORADOR"), controller.listarFechamentos);
router.get("/fechamentos/:codigo", autorizar("GESTOR", "COLABORADOR"), controller.buscarFechamento);
router.post("/fechamentos", autorizar("GESTOR"), controller.criarFechamento);
router.patch("/fechamentos/:codigo", autorizar("GESTOR"), controller.atualizarFechamento);
router.get("/resumo-mensal", autorizar("GESTOR", "COLABORADOR"), controller.resumoMensal);
router.put("/fechamentos/:codigo/qualidade", autorizar("GESTOR"), controller.registrarQualidade);

module.exports = router;
