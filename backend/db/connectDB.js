const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: "./.env" });

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

const connectDB = function() {
  mongoose
    .connect(DB)
    .then(() => {
      // console.log(con.connection);
      console.log("Connection established");
    })
    .catch((err) => console.log(err.message));
};

module.exports = connectDB;
