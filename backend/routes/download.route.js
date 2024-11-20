const express = require("express");

const { getResume } = require("../controllers/download.controller");

const router = express.Router();

router.get("/resume/:file", getResume);

module.exports = router;
