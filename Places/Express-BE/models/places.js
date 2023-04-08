const mongoose = require("mongoose");
//Schemas
const { PlacesSchema } = require("../schemas");

const Model = mongoose.model;
const DB_COLLECTION_NAME = "Places";

//Model
const PlacesModel = Model(DB_COLLECTION_NAME, PlacesSchema);

module.exports = PlacesModel;
