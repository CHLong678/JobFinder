const { model, Schema } = require("mongoose");

const jobSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "Recruiter",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    maxApplicants: {
      type: Number,
      validate: [
        {
          validator: Number.isInteger,
          message: "maxApplicants should be an integer",
        },
        {
          validator: function(value) {
            return value > 0;
          },
          message: "maxApplicants should be greater than 0",
        },
      ],
    },
    maxPositions: {
      type: Number,
      validate: [
        {
          validator: Number.isInteger,
          message: "maxPostions should be an integer",
        },
        {
          validator: function(value) {
            return value > 0;
          },
          message: "maxPositions should greater than 0",
        },
      ],
    },
    activeApplications: {
      type: Number,
      default: 0,
      validate: [
        {
          validator: Number.isInteger,
          message: "activeApplications should be an integer",
        },
        {
          validator: function(value) {
            return value >= 0;
          },
          message: "activeApplications should greater than equal to 0",
        },
      ],
    },
    acceptedCandidates: {
      type: Number,
      default: 0,
      validate: [
        {
          validator: Number.isInteger,
          message: "acceptedCandidates should be an integer",
        },
        {
          validator: function(value) {
            return value >= 0;
          },
          message: "acceptedCandidates should greater than equal to 0",
        },
      ],
    },
    dateOfPosting: {
      type: Date,
      default: Date.now,
    },
    deadline: {
      type: Date,
      validate: [
        {
          validator: function(value) {
            return this.dateOfPosting < value;
          },
          message: "deadline should be greater than dateOfPosting",
        },
      ],
    },
    skillsets: [String],
    jobType: {
      type: String,
      enum: ["Full-time", "Part-time", "Intership", "Contract"],
      required: true,
    },
    duration: {
      type: Number,
      min: 0,
      validate: [
        {
          validator: Number.isInteger,
          message: "Duration should be an integer",
        },
      ],
    },
    salary: {
      type: Number,
      validate: [
        {
          validator: Number.isInteger,
          message: "Salary should be an integer",
        },
        {
          validator: function(value) {
            return value >= 0;
          },
          message: "Salary should be positive",
        },
      ],
    },
    rating: {
      type: Number,
      max: 5.0,
      default: -1.0,
      validate: {
        validator: function(v) {
          return v >= -1.0 && v <= 5.0;
        },
        message: "Invalid rating",
      },
    },
  },
  {
    collection: "Jobs",
    timestamps: true,
  }
);

const Job = model("Job", jobSchema);

module.exports = Job;
