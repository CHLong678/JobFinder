const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const { promisify } = require("util");
const AppError = require("../utils/appError.utils");
const catchAsync = require("../utils/catchAsync.utils");

const pipeline = promisify(require("stream").pipeline);

const uploadResume = catchAsync(async (req, res, next) => {});

const uploadProfile = catchAsync(async (req, res, next) => {});

module.exports = { uploadResume, uploadProfile };
