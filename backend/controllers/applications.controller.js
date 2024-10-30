const catchAsync = require("../utils/catchAsync.utils");
const AppError = require("./../utils/appError.utils");
const APIFeatures = require("../utils/apiFeatures");
const Application = require("../model/application.model");
const Job = require("../model/job.model");

// const User = require("../model/user.model");
// const JobApplicant = require("../model/jobApplicant.model");
// const Recruiter = require("../model/recruiter.model");

// Recruiter/Applicant gets all his applications [pagination]
const getAllApplications = catchAsync(async (req, res, next) => {
  const { type, _id } = req.user;

  // Get job application information
  const aggregatePipeline = [
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
    {
      $lookup: {
        from: "Recruiters",
        localField: "recruiterId",
        foreignField: "userId",
        as: "recruiter",
      },
    },
    { $unwind: "$recruiter" },
    {
      $match: {
        [type === "recruiter" ? "recruiterId" : "userId"]: _id,
      },
    },
    {
      $sort: {
        dateOfApplication: -1, // Sắp xếp theo ngày nộp đơn
      },
    },
  ];

  const features = new APIFeatures(
    Application.aggregate(aggregatePipeline),
    req.query
  )
    .sort()
    .paginate();

  const applications = await features.query;

  if (!applications) return next(new AppError("No applications found", 401));

  res.status(200).json({
    status: "success",
    results: applications.length,
    data: { applications },
  });
});

// Update status of application: [Applicant: Can cancel, Recruiter: Can do everything]
const updateApplicationStatus = catchAsync(async (req, res, next) => {
  const { type, _id } = req.user;
  const { id } = req.params;
  const { status, dateOfJoining } = req.body;

  // "applied", // when a applicant is applied
  // "shortlisted", // when a applicant is shortlisted
  // "accepted", // when a applicant is accepted
  // "rejected", // when a applicant is rejected
  // "deleted", // when any job is deleted
  // "cancelled", // an application is cancelled by its author or when other application is accepted
  // "finished", // when job is over

  if (type === "recruiter") {
    // Recruiter can handle various statuses
    if (status === "accepted") {
      // get job id from application
      // get job info for maxPositions count
      // count applications that are already accepted
      // compare and if condition is satisfied, then save
      const application = await Application.findOne({
        _id: id,
        recruiterId: _id,
      });
      if (!application) return next(new AppError("Application not found", 404));

      const job = await Job.findOne({
        _id: application.jobId,
        userId: _id,
      });
      if (!job) return next(new AppError("Job does not exist", 404));

      const activeApplicationCount = await Application.countDocuments({
        recruiterId: _id,
        jobId: job._id,
        status: "accepted",
      });

      if (activeApplicationCount >= job.maxPositions) {
        return next(
          new AppError("All positions for this job are already filled", 400)
        );
      }

      application.status = "accepted";
      application.dateOfJoining = dateOfJoining || Date.now();
      await application.save();

      await Application.updateMany(
        {
          _id: { $ne: application._id },
          userId: application.userId,
          status: {
            $nin: ["rejected", "deleted", "cancelled", "accepted", "finished"],
          },
        },
        { $set: { status: "cancelled" } }
      );

      await Job.findOneAndUpdate(
        { _id: job._id, userId: _id },
        { $set: { acceptedCandidates: activeApplicationCount + 1 } }
      );

      return res
        .status(200)
        .json({ message: `Application ${status} successfully` });
    }

    // Other statuses handled by recruiter
    const application = await Application.findOneAndUpdate(
      {
        _id: id,
        recruiterId: _id,
        status: { $nin: ["rejected", "deleted", "cancelled"] },
      },
      { $set: { status } },
      { new: true }
    );

    if (!application)
      return next(new AppError("Application status cannot be updated", 400));

    return res
      .status(200)
      .json({ message: `Application ${status} successfully` });
  }

  if (type === "applicant" && status === "cancelled") {
    // Applicant can only cancel their application
    const application = await Application.findOneAndUpdate(
      { _id: id, userId: _id },
      { $set: { status: "cancelled" } },
      { new: true }
    );

    if (!application)
      return next(
        new AppError("Application not found or already updated", 404)
      );

    return res
      .status(200)
      .json({ message: `Application ${status} successfully` });
  }

  return next(
    new AppError("You don't have permissions to update job status", 401)
  );
});

module.exports = {
  getAllApplications,
  updateApplicationStatus,
};
