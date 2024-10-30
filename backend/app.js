const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
// eslint-disable-next-line import/no-extraneous-dependencies
const bodyParser = require("body-parser");
const cors = require("cors");

const passportConfig = require("./lib/passportConfig");
const AppError = require("./utils/appError.utils");
const globalErrorHandler = require("./controllers/error.controller");

const app = express();

// MIDDLEWARES
app.use(helmet());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in one hour.",
});

app.use("/api", limiter);

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.use(cors());
app.use(express.json({ limit: "16000kb" }));
app.use(passportConfig.initialize());

app.use(mongoSanitize());
app.use(xss());

app.use(
  hpp({
    whitelist: [],
  })
);

app.use(express.static(`${__dirname}/public`));

// ROUTES
app.use("/auth", require("./routes/auth.route"));
app.use("/api", require("./routes/api.route"));

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server !`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
