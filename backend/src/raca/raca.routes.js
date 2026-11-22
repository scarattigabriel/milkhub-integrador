const express = require("express");
const racaController = require("./raca.controller");
const autenticar = require("../middlewares/autenticar");
const autorizar = require("../middlewares/autorizar");

const router = express.Router();

router.use(autenticar);

router.get("/", autorizar("GESTOR", "COLABORADOR"), racaController.listar);
router.get("/:codRaca", autorizar("GESTOR", "COLABORADOR"), racaController.buscarPorCod);
router.post("/", autorizar("GESTOR"), racaController.criar);
router.patch("/:codRaca", autorizar("GESTOR"), racaController.atualizar);
router.delete("/:codRaca", autorizar("GESTOR"), racaController.deletar);

module.exports = router;
