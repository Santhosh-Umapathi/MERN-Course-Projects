const axios = require("axios");
//Model
const HttpError = require("../models/http-error");

const API_KEY = process.env.API_KEY;

const getCoordsForAddress = async (address) => {
  try {
    const response = await axios.get(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        address
      )}.json?access_token=${API_KEY}`
    );

    if (response.status !== 200) {
      const error = new HttpError("Address not found", 422);
      throw error;
    }

    // console.log("response", JSON.stringify(response.data));
    return response.data;
  } catch (error) {
    // console.log("Error =>", error);
    throw error;
  }
};

exports.getCoordsForAddress = getCoordsForAddress;
