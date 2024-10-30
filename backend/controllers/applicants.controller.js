const { Types } = require("mongoose");
const catchAsync = require("../utils/catchAsync.utils");
const AppError = require("./../utils/appError.utils");
const Application = require("../model/application.model");

// get a list of final applicants for current job : recruiter
// get a list of final applicants for all his jobs : recuiter
const getApplicants = catchAsync(async (req, res, next) => {
  const { type, _id } = req.user;

  if (type !== "recruiter")
    return next(
      new AppError("You do not have permissions to access applicants list", 403)
    );

  const findParams = { recruiterId: _id };

  if (req.query.jobId) {
    findParams.jobId = new Types.ObjectId(req.query.jobId);
  }

  if (req.query.status) {
    findParams.status = Array.isArray(req.query.status)
      ? { $in: req.query.status }
      : req.query.status;
  }

  const sortParams = {};
  if (req.query.asc) {
    sortParams[req.query.asc] = 1;
  } else if (req.query.desc) {
    sortParams[req.query.desc] = -1;
  } else {
    sortParams._id = 1;
  }

  const applications = await Application.aggregate([
    {
      $lookup: {
        from: "JobApplicants",
        localField: "userId",
        foreignField: "userId",
        as: "jobApplicant",
      },
    },
    { $unwind: "$jobApplicant" },
    {
      $lookup: {
        from: "Jobs",
        localField: "jobId",
        foreignField: "_id",
        as: "job",
      },
    },
    { $unwind: "$job" },
    { $match: findParams },
    { $sort: sortParams },
  ]);

  if (applications.length === 0) {
    return next(new AppError("No applicants found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { applications },
  });
});

module.exports = {
  getApplicants,
};
