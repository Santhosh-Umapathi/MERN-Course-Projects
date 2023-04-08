const { check, validationResult } = require("express-validator");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");

//Models
const { HttpError, User } = require("../models");

//Validations
const signUpValidator = [
  check("name").not().isEmpty(),
  check("email").not().isEmpty().normalizeEmail().isEmail(),
  check("password").isLength({ min: 6 }),
];

const loginUpValidator = [
  check("email").not().isEmpty().normalizeEmail().isEmail(),
  check("password").isLength({ min: 6 }),
];

const validationHandler = (req, next) => {
  const errors = validationResult(req);

  let error;
  if (!errors.isEmpty()) {
    error = new HttpError("Enter valid inputs, please check your data");
  }
  return error;
};

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password");
    if (!users || users.length === 0) {
      const error = new HttpError("No Users found", 422);
      return next(error);
    }

    users = users.map((user) => user.toObject({ getters: true }));
  } catch (err) {
    const error = new HttpError("Failed to fetch users", 422);
    return next(error);
  }

  res.json({ message: "GET Success", users });
};

const signUp = async (req, res, next) => {
  //Validation Check
  const error = validationHandler(req);
  error && next(error);

  const { name, email, password } = req.body;

  let newUser;
  try {
    newUser = await User.findOne({ email });

    if (newUser) {
      const error = new HttpError("User already signed Up", 401);
      return next(error);
    }
  } catch (err) {
    const error = new HttpError("Failed to fetch user", 401);
    return next(error);
  }

  //Password hashing
  let hashedPassword;
  try {
    hashedPassword = await bcryptjs.hash(password, 12);
  } catch (err) {
    const error = new HttpError("Password Hashing failed", 422);
    return next(error);
  }

  try {
    newUser = new User({
      name,
      email,
      password: hashedPassword,
      places: [],
      image: process.env.BACKEND_URL + req.file.path,
    });

    await newUser.save();
    newUser = newUser.toObject({ getters: true });
  } catch (err) {
    const error = new HttpError("Signup failed", 401);
    return next(error);
  }

  //JWT Token Generation
  let token;
  try {
    token = await jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError("Token Generation failed", 422);
    return next(error);
  }

  res.status(201).json({
    message: "Signup Success",
    user: {
      userId: newUser.id,
      name: newUser.name,
      email: newUser.email,
      token,
    },
  });
};

const login = async (req, res, next) => {
  //Validation Check
  const error = validationHandler(req);
  error && next(error);

  const { email, password } = req.body;

  let user;
  try {
    user = await User.findOne({ email });

    if (!user) {
      const error = new HttpError("Invalid Credentials or User not found", 401);
      return next(error);
    }
  } catch (err) {
    const error = new HttpError("Failed to fetch user", 401);
    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcryptjs.compare(password, user.password);
  } catch (err) {
    const error = new HttpError("Password Hashing failed", 401);
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError("Password is incorrect", 401);
    return next(error);
  }

  //JWT Token Generation
  let token;
  try {
    token = await jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError("Token Generation failed", 422);
    return next(error);
  }

  res
    .status(201)
    .json({ message: "Logged In", userId: user.id, email: user.email, token });
};

//Module const exports
module.exports = {
  getUsers,
  signUp,
  login,
  //Validations Exports
  signUpValidator,
  loginUpValidator,
};
