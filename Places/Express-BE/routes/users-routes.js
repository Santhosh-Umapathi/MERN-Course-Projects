const express = require("express");
const userRoutes = express.Router();

//Controllers
const {
  getUsers,
  login,
  signUp,
  loginUpValidator,
  signUpValidator,
} = require("../controllers/users-controller");

//Middlewares
const { fileUpload } = require("../middlewares");

userRoutes.get("/", getUsers);

userRoutes.post("/signup", fileUpload, signUpValidator, signUp);

userRoutes.post("/login", loginUpValidator, login);

module.exports = userRoutes;
