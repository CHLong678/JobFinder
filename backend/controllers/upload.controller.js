// eslint-disable-next-line import/no-extraneous-dependencies
const mime = require("mime-types");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const catchAsync = require("../utils/catchAsync.utils");
const AppError = require("../utils/appError.utils");
const JobApplicant = require("../model/jobApplicant.model");
const Recruiter = require("../model/recruiter.model");

// upload resume for applicant
const uploadResume = catchAsync(async (req, res, next) => {
  const { file } = req;
  const { _id, email } = req.user;

  if (!file) {
    return next(new AppError("No file uploaded.", 400));
  }

  const mimeType = mime.lookup(file.originalname);
  if (!mimeType || mimeType !== "application/pdf") {
    return next(new AppError("Invalid file format. Only PDF allowed.", 400));
  }

  const filename = `${email}-${uuidv4()}.pdf`;
  const filePath = `${__dirname}/../public/resume/${filename}`;

  if (!fs.existsSync(`${__dirname}/../public/resume`)) {
    fs.mkdirSync(`${__dirname}/../public/resume`, { recursive: true });
  }

  fs.writeFileSync(filePath, file.buffer);

  const resumeUrl = `/host/resume/${filename}`;
  const applicant = await JobApplicant.findOneAndUpdate(
    { userId: _id },
    { resume: resumeUrl },
    { new: true }
  );

  if (!applicant) {
    return next(new AppError("Applicant not found.", 404));
  }

  res.status(200).json({
    message: "Resume uploaded successfully.",
    url: resumeUrl,
    applicant,
  });
});

// upload profile(image) for applicant, photo for recruiter
const uploadProfile = catchAsync(async (req, res, next) => {
  const { file } = req;
  const { type, email, _id } = req.user;

  if (!file) {
    return next(new AppError("No file uploaded.", 400));
  }

  if (!["applicant", "recruiter"].includes(type)) {
    return next(
      new AppError("Invalid type. Must be 'applicant' or 'recruiter'.", 400)
    );
  }

  const mimeType = mime.lookup(file.originalname);
  if (!mimeType || !["image/jpeg", "image/png"].includes(mimeType)) {
    return next(
      new AppError("Invalid file format. Only JPG and PNG allowed.", 400)
    );
  }

  const ext = mime.extension(mimeType);
  const filename = `${email}-${uuidv4()}.${ext}`;
  const uploadDir =
    type === "applicant"
      ? `${__dirname}/../public/profile`
      : `${__dirname}/../public/photo`;
  const filePath = `${uploadDir}/${filename}`;

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  fs.writeFileSync(filePath, file.buffer);

  const profileUrl = `/host/${
    type === "applicant" ? "profile" : "photo"
  }/${filename}`;

  if (type === "applicant") {
    const applicant = await JobApplicant.findOneAndUpdate(
      { userId: _id },
      { profile: profileUrl },
      { new: true }
    );

    if (!applicant) {
      return next(new AppError("Applicant not found.", 404));
    }

    return res.status(200).json({
      message: "Profile image uploaded successfully.",
      url: profileUrl,
      applicant,
    });
    // eslint-disable-next-line no-else-return
  } else {
    const recruiter = await Recruiter.findOneAndUpdate(
      { userId: _id },
      { photo: profileUrl },
      { new: true }
    );

    if (!recruiter) {
      return next(new AppError("Recruiter not found.", 404));
    }

    return res.status(200).json({
      message: "Profile image uploaded successfully.",
      url: profileUrl,
      recruiter,
    });
  }
});

module.exports = {
  uploadResume,
  uploadProfile,
};
