const mongoose = require("mongoose");

const Schema = mongoose.Schema;

//Places Schema
const PlacesSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  address: { type: String, required: true },
  image: { type: String, required: true },
  creator: { type: mongoose.Types.ObjectId, required: true, ref: "Users" },
});

module.exports = PlacesSchema;
