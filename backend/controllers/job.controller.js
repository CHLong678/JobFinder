const catchAsync = require("../utils/catchAsync.utils");
const AppError = require("./../utils/appError.utils");
const APIFeatures = require("../utils/apiFeatures");
const factory = require("./handlerFactory.controller");
const Job = require("../model/job.model");

const addNewJob = catchAsync(async (req, res, next) => {
  const { _id, type } = req.user;

  if (type !== "recruiter") {
    return next(new AppError("You don't have permission to add new jobs", 401));
  }

  const {
    title,
    maxApplicants,
    maxPositions,
    dateOfPosting,
    deadline,
    skillsets,
    jobType,
    duration,
    salary,
    rating,
  } = req.body;

  if (!title || !maxApplicants || !maxPositions || !deadline) {
    return next(new AppError("Missing required fields", 400));
  }

  // create a new job
  const job = new Job({
    userId: _id,
    title,
    maxApplicants,
    maxPositions,
    dateOfPosting: dateOfPosting || new Date(), // Default to current date if not provided
    deadline,
    skillsets,
    jobType,
    duration,
    salary,
    rating,
  });

  await job.save();

  res.status(201).json({
    status: "success",
    message: "Job added successfully",
    data: {
      job,
    },
  });
});

// To get all jobs with pagination (for recruiters and general users)
const getAllJobs = catchAsync(async (req, res, next) => {
  let filter = {};

  if (req.params.userId) filter = { tour: req.params.userId };
  const features = new APIFeatures(Job.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const jobs = await features.query;

  if (!jobs.length) {
    return next(new AppError("No jobs were found", 404));
  }

  res.status(200).json({
    status: "success",
    data: jobs,
  });
});

// To get info about a particular job
const getJob = factory.getOne(Job);

// To update info of particular job
const updateJob = catchAsync(async (req, res, next) => {
  const { id, type } = req.user;

  if (type !== "recruiter")
    return next(
      new AppError("You don't have permissions to change the job details", 401)
    );

  const job = await Job.findOne({ _id: req.params.id, userId: id });

  console.log("id: ", id);

  if (!job) return next(new AppError("Job not found", 404));

  const {
    maxApplicants,
    maxPositions,
    deadline,
    skillsets,
    jobType,
    duration,
    salary,
  } = req.body;

  if (maxApplicants) job.maxApplicants = maxApplicants;
  if (maxPositions) job.maxPositions = maxPositions;
  if (deadline) job.deadline = deadline;
  if (skillsets) job.skillsets = skillsets;
  if (jobType) job.jobType = jobType;
  if (duration) job.duration = duration;
  if (salary) job.salary = salary;

  await job.save();

  res.status(200).json({
    status: "success",
    data: { job },
  });
});

const deleteJob = catchAsync(async (req, res, next) => {
  const { id, type } = req.user;

  if (type !== "recruiter")
    return next(
      new AppError("You don't have permissions to delete the job", 401)
    );

  const job = await Job.findOneAndDelete({ _id: req.params.id, userId: id });

  if (!job) return next(new AppError("No job with that ID", 404));

  res.status(204).json({
    status: "success",
    data: null,
  });
});

module.exports = {
  addNewJob,
  getAllJobs,
  getJob,
  updateJob,
  deleteJob,
};
