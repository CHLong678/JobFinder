const catchAsync = require("../utils/catchAsync.utils");
const AppError = require("./../utils/appError.utils");
const APIFeatures = require("../utils/apiFeatures");
const User = require("../model/user.model");
const JobApplicant = require("../model/jobApplicant.model");
const Recruiter = require("../model/recruiter.model");
const Application = require("../model/application.model");
const Job = require("../model/job.model");

// To get current user's personal details
const getCurrentUserDetails = catchAsync(async (req, res, next) => {
  const { _id, type } = req.user;
  let user;

  if (type === "recruiter") {
    user = await Recruiter.findOne({ userId: _id });
  } else {
    user = await JobApplicant.findOne({ userId: _id });
  }

  if (!user) return next(new AppError("User does not exist", 404));

  return res.status(200).json({
    status: "success",
    data: { user },
  });
});

const getUserDetailsById = catchAsync(async (req, res, next) => {
  const userData = await User.findById(req.params.id);

  if (!userData) return next(new AppError("User does not exist", 404));

  let userDetails;

  if (userData.type === "recruiter") {
    userDetails = await Recruiter.findOne({ userId: userData._id });
  } else {
    userDetails = await JobApplicant.findOne({ userId: userData._id });
  }

  if (!userDetails)
    return next(new AppError("Not found user with that ID", 404));

  res.status(200).json({
    status: "success",
    data: { userDetails },
  });
});

const updateUserDetails = catchAsync(async (req, res, next) => {
  const { type, _id } = req.user;
  const {
    name,
    contactNumber,
    bio,
    location,
    photo,
    education,
    skills,
    resume,
    profile,
  } = req.body;

  let userDetails;

  if (type === "recruiter") {
    userDetails = await Recruiter.findOne({ userId: _id });

    if (!userDetails)
      return next(new AppError("Not found user with that ID", 404));

    if (name) userDetails.name = name;
    if (contactNumber) userDetails.contactNumber = contactNumber;
    if (bio) userDetails.bio = bio;
    if (location) userDetails.location = location;
    if (photo) userDetails.photo = photo;
  } else {
    userDetails = await JobApplicant.findOne({ userId: _id });

    if (!userDetails)
      return next(new AppError("Not found user with that ID", 404));

    if (name) userDetails.name = name;
    if (education) userDetails.education = education;
    if (skills) userDetails.skills = skills;
    if (resume) userDetails.resume = resume;
    if (profile) userDetails.profile = profile;
  }

  await userDetails.save();

  res.status(200).json({
    status: "success",
    message: "User updated successfully",
    data: { userDetails },
  });
});

// Apply for a job
const applyForJob = catchAsync(async (req, res, next) => {
  const { _id, type } = req.user;
  if (type === "recruiter")
    return next(
      new AppError("You don't have permission to apply for a job", 401)
    );

  const { sop } = req.body;
  const jobId = req.params.id;

  // Check to see if you have applied before
  const appliedApplication = await Application.findOne({
    userId: _id,
    jobId: jobId,
    status: { $nin: ["deleted", "accepted", "cancelled"] },
  });

  if (appliedApplication)
    return next(new AppError("You have already applied for this job", 400));

  const job = await Job.findById(jobId);
  if (!job) return next(new AppError("Job not found", 404));

  // Check the number of remaining applications
  const activeApplicationCount = await Application.countDocuments({
    jobId: jobId,
    status: { $nin: ["rejected", "deleted", "cancelled", "finished"] },
  });

  if (activeApplicationCount >= job.maxApplicants)
    return next(new AppError("Application limit reached", 400));

  // Check for users who have less than 10 active applications and have not accepted any jobs
  const myActiveApplicationCount = await Application.countDocuments({
    userId: _id,
    status: { $nin: ["rejected", "deleted", "cancelled", "finished"] },
  });

  if (myActiveApplicationCount >= 10)
    return next(
      new AppError(
        "You have 10 active applications. Hence you cannot apply",
        400
      )
    );

  const acceptedJobs = await Application.countDocuments({
    userId: _id,
    status: "accepted",
  });

  if (acceptedJobs > 0)
    return next(
      new AppError(
        "You already have an accepted job. Hence you cannot apply",
        400
      )
    );

  // Save job applications
  const application = new Application({
    userId: _id,
    recruiterId: job.userId,
    jobId: job._id,
    status: "applied",
    sop,
  });

  await application.save();

  res.status(200).json({
    status: "success",
    message: "Job application successfully",
    data: { application },
  });
});

// Recruiter gets applications for a particular job [pagination]
const getJobApplications = catchAsync(async (req, res, next) => {
  const { type, _id } = req.user;
  const jobId = req.params.id;

  if (type !== "recruiter")
    return next(
      new AppError("You do not have permissions to view job applications", 401)
    );

  if (!jobId) return next(new AppError("Invalid job ID", 400));

  //  Check if the job exists and is under the employer's authority
  const job = await Job.findOne({ _id: jobId, userId: _id });
  if (!job) return next(new AppError("Job not found or access denied", 404));

  const findParams = { jobId: jobId, recruiterId: _id };

  if (req.query.status) findParams.status = req.query.status;

  const features = new APIFeatures(Application.find(findParams), req.query)
    .find()
    .sort()
    .limitFields()
    .paginate();

  const applications = await features.query;

  res.status(200).json({
    status: "success",
    results: applications.length,
    data: { applications },
  });
});

const getAllRecruiters = catchAsync(async (req, res, next) => {
  const filter = {};

  const features = new APIFeatures(Recruiter.find(filter), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const recruiters = await features.query.lean();

  if (!recruiters.length) {
    return next(new AppError("No recruiters were found", 404));
  }

  res.status(200).json({
    status: "success",
    data: recruiters,
  });
});

module.exports = {
  getCurrentUserDetails,
  getUserDetailsById,
  updateUserDetails,
  applyForJob,
  getJobApplications,
  getAllRecruiters,
};
