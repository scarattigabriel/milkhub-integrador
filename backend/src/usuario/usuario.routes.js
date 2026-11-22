const express = require("express");
const usuarioController = require("./usuario.controller");
const autenticar = require("../middlewares/autenticar");
const autorizar = require("../middlewares/autorizar");

const router = express.Router();

router.use(autenticar, autorizar("GESTOR"));
router.get("/", usuarioController.listar);

router.get("/por-login", usuarioController.buscarPorLogin);
router.get("/:codUsuario", usuarioController.buscarPorCod);
router.post("/", usuarioController.criar);
router.patch("/:codUsuario", usuarioController.atualizar);
router.delete("/:codUsuario", usuarioController.deletar);

module.exports = router;
