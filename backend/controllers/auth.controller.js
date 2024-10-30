// auth.controller.js
const passport = require("passport");
const jwt = require("jsonwebtoken");
const authKeys = require("../lib/authKeys");
const User = require("../model/user.model");
const JobApplicant = require("../model/jobApplicant.model");
const Recruiter = require("../model/recruiter.model");

const signUp = async (req, res) => {
  const data = req.body;
  const user = new User({
    email: data.email,
    password: data.password,
    type: data.type,
  });

  try {
    await user.save();

    const userDetails =
      user.type === "recruiter"
        ? new Recruiter({
            userId: user._id,
            name: data.name,
            contactNumber: data.contactNumber,
            bio: data.bio,
          })
        : new JobApplicant({
            userId: user._id,
            name: data.name,
            education: data.education,
            skills: data.skills,
            rating: data.rating,
            resume: data.resume,
            profile: data.profile,
          });

    await userDetails.save();

    // Token
    const token = jwt.sign({ _id: user._id }, authKeys.jwtSecretKey);
    res.json({
      token: token,
      type: user.type,
    });
  } catch (err) {
    await User.deleteOne({ _id: user._id }); // Delete the user if there's an error
    res.status(400).json(err);
  }
};

const logIn = (req, res, next) => {
  passport.authenticate("local", { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json(info);
    }

    // Token
    const token = jwt.sign({ _id: user._id }, authKeys.jwtSecretKey);
    res.json({
      token: token,
      type: user.type,
    });
  })(req, res, next);
};

module.exports = {
  signUp,
  logIn,
};
