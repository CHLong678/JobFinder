const { model, Schema } = require("mongoose");

const recruiterSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    contactNumber: {
      type: String,
      validate: {
        validator: function(v) {
          return v !== "" ? /\+\d{1,3}\d{10}/.test(v) : true;
        },
        message: "Phone number is invalid!",
      },
    },
    bio: {
      type: String,
    },
  },
  {
    collection: "Recruiters",
    timestamps: true,
  }
);

const Recruiter = model("Recruiter", recruiterSchema);

module.exports = Recruiter;
