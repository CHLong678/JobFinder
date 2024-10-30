const { model, Schema } = require("mongoose");

const jobApplicantSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    education: [
      {
        institutionName: {
          type: String,
          required: true,
        },
        startYear: {
          type: Number,
          min: 1950,
          max: new Date().getFullYear(),
          required: true,
          validate: Number.isInteger,
        },
        endYear: {
          type: Number,
          // max: new Date().getFullYear(),
          validate: [
            {
              validator: Number.isInteger,
              message: "Year should be an integer",
            },
            {
              validator: function(value) {
                return this.startYear <= value;
              },
              message: "End year should be greater than or equal to Start year",
            },
          ],
        },
      },
    ],
    skills: [String],
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
    resume: {
      type: String,
    },
    profile: {
      type: String,
    },
  },
  {
    collection: "JobApplicants",
    timestamps: true,
  }
);

const JobApplicant = model("JobApplicant", jobApplicantSchema);

module.exports = JobApplicant;
