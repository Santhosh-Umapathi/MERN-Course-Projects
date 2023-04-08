const mongoose = require("mongoose");
//Schemas
const { UserSchema } = require("../schemas");

const Model = mongoose.model;
const DB_COLLECTION_NAME = "Users";

//Model
const UserModel = Model(DB_COLLECTION_NAME, UserSchema);

module.exports = UserModel;
