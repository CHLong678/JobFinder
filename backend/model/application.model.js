const { model, Schema } = require("mongoose");

const applicationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    recruiter: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "applied", // when a applicant is applied
        "shortlisted", // when a applicant is shortlisted
        "accepted", // when a applicant is accepted
        "rejected", // when a applicant is rejected
        "deleted", // when any job is deleted
        "cancelled", // an application is cancelled by its author or when other application is accepted
        "finished", // when job is over
      ],
      default: "applied",
      required: true,
    },
    dateOfApplication: {
      type: Date,
      default: Date.now(),
    },
    dateOfJoining: {
      type: Date,
      validate: [
        {
          validator: function(value) {
            return this.dateOfApplication <= value;
          },
          message: "dateOfJoining should be greater than dateOfApplication",
        },
      ],
    },
    sop: {
      type: String,
      validate: {
        validator: function(v) {
          // eslint-disable-next-line eqeqeq
          return v.split(" ").filter((ele) => ele != "").length <= 250;
        },
        message: "Statement of purpose should not be greater than 250 words",
      },
    },
  },
  {
    collection: "Applications",
    timestamp: true,
  }
);

const Application = model("Application", applicationSchema);

module.exports = Application;
