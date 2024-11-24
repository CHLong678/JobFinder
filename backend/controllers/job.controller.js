const catchAsync = require("../utils/catchAsync.utils");
const AppError = require("./../utils/appError.utils");
const APIFeatures = require("../utils/apiFeatures");
// eslint-disable-next-line no-unused-vars
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

// To get info about a particular job
const jobPopOptions = {
  path: "userId",
  model: "User",
  select: "type",
  populate: {
    path: "recruiter",
    model: "Recruiter",
    select: "name contactNumber photo location",
  },
};

// To search jobs for a user
const searchJob = catchAsync(async (req, res, next) => {
  const {
    title,
    skillsets,
    jobType,
    minSalary,
    maxSalary,
    rating,
    page = 1,
    limit = 15,
  } = req.query;

  const searchCriteria = {};

  if (title) searchCriteria.title = { $regex: title, $options: "i" };
  if (skillsets) {
    const skillsArray = skillsets.split(",");
    searchCriteria.skillsets = {
      $in: skillsArray.map((skill) => new RegExp(skill.trim(), "i")),
    };
  }

  if (jobType) searchCriteria.jobType = { $regex: jobType, $options: "i" };
  if (minSalary || maxSalary) {
    searchCriteria.salary = {};
    if (minSalary) searchCriteria.salary.$gte = minSalary;
    if (maxSalary) searchCriteria.salary.$lte = maxSalary;
  }
  if (rating) searchCriteria.rating = { $gte: rating };

  const jobs = await Job.find(searchCriteria)
    .populate(jobPopOptions)
    .skip((page - 1) / limit)
    .limit(limit);

  if (!jobs.length)
    return next(new AppError("No jobs found matching criteria!", 404));

  const totalJobs = await Job.countDocuments(searchCriteria);

  res.status(200).json({
    status: "success",
    data: {
      jobs,
      totalJobs,
      totalPages: Math.ceil(totalJobs / limit),
      currentPage: page,
    },
  });
});

// To get all jobs with pagination (for recruiters and general users)
const getAllJobs = catchAsync(async (req, res, next) => {
  const filter = {};

  const features = new APIFeatures(Job.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const jobs = await features.query.populate(jobPopOptions).lean();

  if (!jobs.length) {
    return next(new AppError("No jobs were found", 404));
  }

  res.status(200).json({
    status: "success",
    data: jobs,
  });
});

// To get a specific information of the job
const getJob = factory.getOne(Job, jobPopOptions);

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
  searchJob,
  getAllJobs,
  getJob,
  updateJob,
  deleteJob,
};
