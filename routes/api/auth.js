const express = require("express");
const ctrl = require("../../controllers/auth");

const { validateBody } = require("../../middlewares");
const {schemas}=require("../../models/auth")

const router = express.Router();
router.post("/register", validateBody(schemas.registerschema), ctrl.register)

module.export = router;
