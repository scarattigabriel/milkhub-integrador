const express = require("express");
const controller = require("./controle-reprodutivo.controller");
const autenticar = require("../middlewares/autenticar");
const autorizar = require("../middlewares/autorizar");

const router = express.Router();
router.use(autenticar);
router.get("/parametros", autorizar("GESTOR", "COLABORADOR"), controller.parametros);

router.get("/inseminacoes", autorizar("GESTOR", "COLABORADOR"), controller.listarInseminacao);
router.get("/inseminacoes/:codigo", autorizar("GESTOR", "COLABORADOR"), controller.buscarInseminacao);
router.post("/inseminacoes", autorizar("GESTOR"), controller.registrarInseminacao);

router.get("/diagnosticos", autorizar("GESTOR", "COLABORADOR"), controller.listarDiagnostico);
router.get("/diagnosticos/:codigo", autorizar("GESTOR", "COLABORADOR"), controller.buscarDiagnostico);
router.post("/diagnosticos", autorizar("GESTOR"), controller.registrarDiagnostico);

router.get("/gestacoes", autorizar("GESTOR", "COLABORADOR"), controller.listarGestacao);
router.get("/gestacoes/:codigo", autorizar("GESTOR", "COLABORADOR"), controller.buscarGestacao);
router.post("/gestacoes", autorizar("GESTOR"), controller.registrarGestacao);

router.get("/secagens", autorizar("GESTOR", "COLABORADOR"), controller.listarSecagem);
router.get("/secagens/:codigo", autorizar("GESTOR", "COLABORADOR"), controller.buscarSecagem);
router.post("/secagens", autorizar("GESTOR"), controller.registrarSecagem);

router.get("/partos", autorizar("GESTOR", "COLABORADOR"), controller.listarParto);
router.get("/partos/:codigo", autorizar("GESTOR", "COLABORADOR"), controller.buscarParto);
router.post("/partos", autorizar("GESTOR"), controller.registrarParto);

router.patch("/gestacoes/:codigo", autorizar("GESTOR"), controller.ajustarPrevisoes);
router.patch("/gestacoes/:codigo/perda", autorizar("GESTOR"), controller.registrarPerda);

module.exports = router;
