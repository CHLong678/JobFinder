const express = require("express");
const jwtAuth = require("../lib/jwtAuth");
const JobController = require("../controllers/job.controller");
const UserController = require("../controllers/user.controller");
const ApplicationsController = require("../controllers/applications.controller");
const ApplicantsController = require("../controllers/applicants.controller");
const RatingController = require("../controllers/rating.controller");

const router = express.Router();

//JOB ROUTES
router
  .route("/jobs")
  .post(jwtAuth, JobController.addNewJob)
  .get(jwtAuth, JobController.getAllJobs);

router
  .route("/jobs/:id")
  .get(jwtAuth, JobController.getJob)
  .patch(jwtAuth, JobController.updateJob)
  .delete(jwtAuth, JobController.deleteJob);

router.route("/search").get(JobController.searchJob);

// USER ROUTES
router.route("/user/me").get(jwtAuth, UserController.getCurrentUserDetails);

router.route("/user").get(UserController.getAllRecruiters);

router
  .route("/user/:id")
  .get(jwtAuth, UserController.getUserDetailsById)
  .patch(jwtAuth, UserController.updateUserDetails);

router
  .route("/jobs/:id/applications")
  .post(jwtAuth, UserController.applyForJob)
  .get(jwtAuth, UserController.getJobApplications);

// APPLICATION ROUTES
router
  .route("/applications")
  .get(jwtAuth, ApplicationsController.getAllApplications);

router
  .route("/applications/:id")
  .put(jwtAuth, ApplicationsController.updateApplicationStatus);

// APPLICANTS ROUTES
router.route("/applicants").get(jwtAuth, ApplicantsController.getApplicants);

// RATING ROUTES
router
  .route("/rating")
  .put(jwtAuth, RatingController.createAndUpdateRating)
  .get(jwtAuth, RatingController.getRating);

module.exports = router;
