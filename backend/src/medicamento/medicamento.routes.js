const express = require("express");
const medicamentoController = require("./medicamento.controller");
const autenticar = require("../middlewares/autenticar");
const autorizar = require("../middlewares/autorizar");

const router = express.Router();
router.use(autenticar);

router.get("/", autorizar("GESTOR", "COLABORADOR"), medicamentoController.listar);
router.get("/:codMedicamento", autorizar("GESTOR", "COLABORADOR"), medicamentoController.buscarPorCod);
router.post("/", autorizar("GESTOR"), medicamentoController.criar);
router.patch("/:codMedicamento", autorizar("GESTOR"), medicamentoController.atualizar);
router.delete("/:codMedicamento", autorizar("GESTOR"), medicamentoController.deletar);

module.exports = router;
