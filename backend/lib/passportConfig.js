/*eslint-disable*/
const passport = require("passport");
const Strategy = require("passport-local");
const passportJWT = require("passport-jwt");
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
const User = require("../model/user.model");
const authKeys = require("./authKeys");

// Filter unwanted keys from a JSON object
const filterJson = (obj, unwantedKeys) => {
  const filteredObj = {};
  Object.keys(obj).forEach((key) => {
    if (!unwantedKeys.includes(key)) {
      filteredObj[key] = obj[key];
    }
  });
  return filteredObj;
};

// Local authentication strategy
passport.use(
  new Strategy(
    {
      usernameField: "email",
      passReqToCallback: true,
    },
    async (req, email, password, done) => {
      try {
        const user = await User.findOne({ email: email });

        if (!user) {
          return done(null, false, {
            message: "User does not exist!",
          });
        }

        // Assuming `login` is an asynchronous method to validate password
        await user.login(password);

        user["_doc"] = filterJson(user["_doc"], ["password", "__v"]);
        return done(null, user);
      } catch (err) {
        return done(err, false, {
          message: "Password is incorrect.",
        });
      }
    }
  )
);

// JWT authentication strategy
passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: authKeys.jwtSecretKey,
    },
    async (jwt_payload, done) => {
      try {
        const user = await User.findById(jwt_payload._id);

        if (!user) {
          return done(null, false, {
            message: "JWT Token does not exist",
          });
        }

        user["_doc"] = filterJson(user["_doc"], ["password", "__v"]);
        return done(null, user);
      } catch (err) {
        return done(err, false, {
          message: "Incorrect Token",
        });
      }
    }
  )
);

module.exports = passport;
