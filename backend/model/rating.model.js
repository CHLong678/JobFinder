const { model, Schema } = require("mongoose");

const ratingSchema = new Schema(
  {
    category: {
      type: String,
      enum: ["job", "applicant"],
      required: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      required: true,
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
    collection: "Ratings",
    timestamps: true,
  }
);

ratingSchema.index(
  { category: 1, receiverId: 1, senderId: 1 },
  { unique: true }
);

const Rating = model("Rating", ratingSchema);

module.exports = Rating;
