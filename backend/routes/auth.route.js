const express = require("express");
const { logIn, signUp } = require("../controllers/auth.controller");

const router = express.Router();

router.post("/signup", signUp);
router.post("/login", logIn);

module.exports = router;
