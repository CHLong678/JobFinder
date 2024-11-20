const express = require("express");
const multer = require("multer");
const jwtAuth = require("../lib/jwtAuth");

const {
  uploadResume,
  uploadProfile,
} = require("../controllers/upload.controller");

const router = express.Router();

const storage = multer.memoryStorage();

const upload = multer({ storage });

// Route upload resume
router.post("/resume", jwtAuth, upload.single("file"), uploadResume);

// Route upload profile
router.post("/profile", jwtAuth, upload.single("file"), uploadProfile);

module.exports = router;
