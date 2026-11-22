const express = require("express");
const controller = require("./documento.controller");
const autenticar = require("../middlewares/autenticar");
const autorizar = require("../middlewares/autorizar");

const router = express.Router();
router.use(autenticar);

router.get("/", autorizar("GESTOR", "COLABORADOR"), controller.listar);
router.get("/:codigo/arquivo", autorizar("GESTOR", "COLABORADOR"), controller.baixar);
router.get("/:codigo", autorizar("GESTOR", "COLABORADOR"), controller.buscarPorCod);
router.post("/", autorizar("GESTOR"), express.raw({
    // Permitir ler o corpo do envio como arquivo binário
    type: () => true, limit: "10mb" }), controller.anexar);
router.delete("/:codigo", autorizar("GESTOR"), controller.deletar);

module.exports = router;
