const fs = require("fs");
const path = require("path");
const AppError = require("../utils/appError.utils");
const catchAsync = require("../utils/catchAsync.utils");

exports.getResume = catchAsync(async (req, res, next) => {
  const address = path.join(__dirname, `../public/resume/${req.params.file}`);

  fs.access(address, fs.constants.F_OK, (err) => {
    if (err) {
      return next(new AppError("File not found", 404));
    }
    res.sendFile(address);
  });
});
