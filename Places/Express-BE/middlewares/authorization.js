const { HttpError } = require("../models");
const jwt = require("jsonwebtoken");

const authorization = (req, res, next) => {
  //Allows the initial preflight requests
  if (req.method === "OPTIONS") {
    return next();
  }
  try {
    const token = req.headers.authorization.split(" ")[1]; //token sent in headers, 'Bearer xxx'

    if (!token) {
      const error = new HttpError("Authorization failed, token not found", 401);
      return next(error);
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET); //Extract the token from decryption
    req.userData = { userId: decodedToken.userId };
    next();
  } catch (err) {
    console.log("🚀 --- authorization --- err", err);
    const error = new HttpError("Authentication failed", 401);
    return next(error);
  }
};

module.exports = authorization;
