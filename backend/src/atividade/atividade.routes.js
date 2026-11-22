const express = require("express");
const controller = require("./atividade.controller");
const autenticar = require("../middlewares/autenticar");
const autorizar = require("../middlewares/autorizar");

const router = express.Router();
router.use(autenticar);

router.get("/", autorizar("GESTOR", "COLABORADOR"), controller.listar);
router.get("/:codAtividade", autorizar("GESTOR", "COLABORADOR"), controller.buscarPorCod);
router.post("/", autorizar("GESTOR"), controller.criar);
router.patch("/:codAtividade", autorizar("GESTOR"), controller.atualizar);
router.patch("/:codAtividade/concluir", autorizar("GESTOR"), controller.concluir);
router.patch("/:codAtividade/cancelar", autorizar("GESTOR"), controller.cancelar);

module.exports = router;
