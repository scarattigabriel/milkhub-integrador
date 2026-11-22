const express = require("express");
const controller = require("./uso-medicamento.controller");
const autenticar = require("../middlewares/autenticar");
const autorizar = require("../middlewares/autorizar");

const router = express.Router();
router.use(autenticar);

router.get("/", autorizar("GESTOR", "COLABORADOR"), controller.listar);
router.get("/carencias", autorizar("GESTOR", "COLABORADOR"), controller.listarCarencias);
router.get("/:codUso", autorizar("GESTOR", "COLABORADOR"), controller.buscarPorCod);
router.post("/", autorizar("GESTOR"), controller.criar);
router.patch("/:codUso", autorizar("GESTOR"), controller.atualizar);
router.delete("/:codUso", autorizar("GESTOR"), controller.deletar);

module.exports = router;
