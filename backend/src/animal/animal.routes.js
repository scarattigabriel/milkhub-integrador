const express = require("express");
const animalController = require("./animal.controller");
const autenticar = require("../middlewares/autenticar");
const autorizar = require("../middlewares/autorizar");

const router = express.Router();
router.use(autenticar);

router.get("/", autorizar("GESTOR", "COLABORADOR"), animalController.listar);
router.get("/:codAnimal/historico", autorizar("GESTOR", "COLABORADOR"), animalController.buscarHistorico);
router.get("/:codAnimal", autorizar("GESTOR", "COLABORADOR"), animalController.buscarPorCod);
router.post("/", autorizar("GESTOR"), animalController.criar);
router.patch("/:codAnimal", autorizar("GESTOR"), animalController.atualizar);
router.patch("/:codAnimal/saida", autorizar("GESTOR"), animalController.registrarSaida);

module.exports = router;
