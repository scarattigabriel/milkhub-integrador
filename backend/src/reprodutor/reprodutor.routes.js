const express = require("express");
const reprodutorController = require("./reprodutor.controller");
const autenticar = require("../middlewares/autenticar");
const autorizar = require("../middlewares/autorizar");

const router = express.Router();
router.use(autenticar);

router.get("/", autorizar("GESTOR", "COLABORADOR"), reprodutorController.listar);
router.get("/:codReprodutor", autorizar("GESTOR", "COLABORADOR"), reprodutorController.buscarPorCod);
router.post("/", autorizar("GESTOR"), reprodutorController.criar);
router.patch("/:codReprodutor", autorizar("GESTOR"), reprodutorController.atualizar);
router.delete("/:codReprodutor", autorizar("GESTOR"), reprodutorController.deletar);

module.exports = router;
