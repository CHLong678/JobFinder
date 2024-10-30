const { model, Schema } = require("mongoose");

const recruiterSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    contactNumber: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return /^\+\d{1,3}[-\s]?\d{1,4}[-\s]?\d{3}[-\s]?\d{3}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid phone number!`,
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
