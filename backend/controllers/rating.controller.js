const mongoose = require("mongoose");
const catchAsync = require("../utils/catchAsync.utils");
const AppError = require("./../utils/appError.utils");

const Application = require("../model/application.model");
const Job = require("../model/job.model");
const JobApplicant = require("../model/jobApplicant.model");
const Rating = require("../model/rating.model");

async function updateAverageRating(receiverId, category) {
  const result = await Rating.aggregate([
    {
      $match: { receiverId: new mongoose.Types.ObjectId(receiverId), category },
    },
    { $group: { _id: null, average: { $avg: "$rating" } } },
  ]);

  if (!result || result.length === 0) return;

  const avg = result[0].average;

  if (category === "applicant") {
    await JobApplicant.findOneAndUpdate(
      { userId: receiverId },
      { $set: { rating: avg } }
    );
  } else if (category === "job") {
    await Job.findOneAndUpdate({ _id: receiverId }, { $set: { rating: avg } });
  }
}

const createAndUpdateRating = catchAsync(async (req, res, next) => {
  const { _id, type } = req.user;
  const { applicantId, jobId, rating } = req.body;

  if (type === "recruiter") {
    // Recruiter can rate applicant
    const existingRating = await Rating.findOne({
      senderId: _id,
      receiverId: applicantId,
      category: "applicant",
    });

    const acceptedCount = await Application.countDocuments({
      userId: applicantId,
      recruiterId: _id,
      status: { $in: ["accepted", "finished"] },
    });

    if (!existingRating) {
      if (acceptedCount > 0) {
        // Add a new rating
        const newRating = new Rating({
          category: "applicant",
          receiverId: applicantId,
          senderId: _id,
          rating,
        });

        await newRating.save();
        await updateAverageRating(applicantId, "applicant");
        return res.json({ message: "Rating added successfully" });
      }

      return next(
        new AppError(
          "Applicant didn't work under you. Hence you cannot give a rating.",
          400
        )
      );
    }

    // Update existing rating
    existingRating.rating = rating;
    await existingRating.save();
    await updateAverageRating(applicantId, "applicant");
    return res.json({ message: "Rating updated successfully" });
  }

  // Applicant can rate job
  const existingJobRating = await Rating.findOne({
    senderId: _id,
    receiverId: jobId,
    category: "job",
  });

  const applicantAcceptedCount = await Application.countDocuments({
    userId: _id,
    jobId,
    status: { $in: ["accepted", "finished"] },
  });

  if (!existingJobRating) {
    if (applicantAcceptedCount > 0) {
      // Add a new job rating
      const newJobRating = new Rating({
        category: "job",
        receiverId: jobId,
        senderId: _id,
        rating,
      });

      await newJobRating.save();
      await updateAverageRating(jobId, "job");
      return res.json({ message: "Rating added successfully" });
    }

    return next(
      new AppError(
        "You haven't worked for this job. Hence you cannot give a rating.",
        400
      )
    );
  }

  // Update existing job rating
  existingJobRating.rating = rating;
  await existingJobRating.save();
  await updateAverageRating(jobId, "job");
  return res.json({ message: "Rating updated successfully" });
});

const getRating = catchAsync(async (req, res, next) => {
  const { type, _id } = req.user;
  const receiverId = req.query.id;
  const category = type === "recruiter" ? "applicant" : "job";

  const rating = await Rating.findOne({
    senderId: _id,
    receiverId,
    category,
  });

  if (!rating) return next(new AppError("Not found rating", 404));

  res.status(200).json({
    status: "success",
    data: { rating },
  });
});

module.exports = {
  createAndUpdateRating,
  getRating,
};
