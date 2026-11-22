const express = require("express");
const authController = require("./auth.controller");
const autenticar = require("../middlewares/autenticar");

const router = express.Router();

router.post("/login", authController.login);
router.get("/me", autenticar, authController.me);

module.exports = router;
