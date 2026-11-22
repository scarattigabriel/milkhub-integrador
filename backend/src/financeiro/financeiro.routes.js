const express = require("express");
const controller = require("./financeiro.controller");
const autenticar = require("../middlewares/autenticar");
const autorizar = require("../middlewares/autorizar");

const router = express.Router();
router.use(autenticar);
router.use(autorizar("GESTOR"));

router.get("/resumo", controller.resumo);
router.get("/fornecedores", controller.listarFornecedor);
router.get("/fornecedores/:codigo", controller.buscarPorCodFornecedor);
router.post("/fornecedores", controller.criarFornecedor);
router.patch("/fornecedores/:codigo", controller.atualizarFornecedor);
router.delete("/fornecedores/:codigo", controller.deletarFornecedor);
router.get("/tipos-custo", controller.listarTipoCusto);
router.get("/tipos-custo/:codigo", controller.buscarPorCodTipoCusto);
router.post("/tipos-custo", controller.criarTipoCusto);
router.patch("/tipos-custo/:codigo", controller.atualizarTipoCusto);
router.delete("/tipos-custo/:codigo", controller.deletarTipoCusto);
router.get("/tipos-receita", controller.listarTipoReceita);
router.get("/tipos-receita/:codigo", controller.buscarPorCodTipoReceita);
router.post("/tipos-receita", controller.criarTipoReceita);
router.patch("/tipos-receita/:codigo", controller.atualizarTipoReceita);
router.delete("/tipos-receita/:codigo", controller.deletarTipoReceita);
router.get("/custos", controller.listarCusto);
router.get("/custos/:codigo", controller.buscarPorCodCusto);
router.post("/custos", controller.criarCusto);
router.patch("/custos/:codigo", controller.atualizarCusto);
router.delete("/custos/:codigo", controller.deletarCusto);
router.get("/receitas", controller.listarReceita);
router.get("/receitas/:codigo", controller.buscarPorCodReceita);
router.post("/receitas", controller.criarReceita);
router.patch("/receitas/:codigo", controller.atualizarReceita);
router.delete("/receitas/:codigo", controller.deletarReceita);

module.exports = router;
