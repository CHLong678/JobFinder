// eslint-disable-next-line import/no-extraneous-dependencies
const multer = require("multer");
const express = require("express");
// const jwtAuth = require("../lib/jwtAuth");
const UploadController = require("../controllers/upload.controller");
const AppError = require("../utils/appError.utils");

const router = express.Router();
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    const allowedMimeTypes = ["image/jpeg", "image/png"];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError("Invalid file format", 400), false);
    }
  },
});

router
  .route("/resume")
  .post(upload.single("file"), UploadController.uploadResume);

router
  .route("/profile")
  .post(upload.single("file"), UploadController.uploadProfile);

module.exports = router;
