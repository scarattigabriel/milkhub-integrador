const express = require("express");
const controller = require("./dashboard.controller");
const autenticar = require("../middlewares/autenticar");
const autorizar = require("../middlewares/autorizar");

const router = express.Router();
router.use(autenticar);

router.get("/", autorizar("GESTOR", "COLABORADOR"), controller.consultar);

module.exports = router;
