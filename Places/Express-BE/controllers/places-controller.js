const { check, validationResult } = require("express-validator");
const mongoose = require("mongoose");
const fs = require("fs");

//Models
const { HttpError, Place, User } = require("../models");

//Utils
const { getCoordsForAddress } = require("../utils/location");

//------------------------------------------------------------------
//MARK: Validations
//------------------------------------------------------------------
const createPlaceValidator = [
  check("title").not().isEmpty(),
  check("address").not().isEmpty(),
  check("description").isLength({ min: 5 }),
];

const updatePlaceValidator = [
  check("title").not().isEmpty(),
  check("description").isLength({ min: 5 }),
];

const validationHandler = (req, next) => {
  const errors = validationResult(req);

  let error;
  if (!errors.isEmpty()) {
    error = new HttpError("Enter valid inputs, please check your data");
  }
  return error;
};

//------------------------------------------------------------------
//MARK: Controllers
//------------------------------------------------------------------
const getPlacesById = async (req, res, next) => {
  //:pid is dynamic param
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
    place = place.toObject({ getters: true }); //Convery mongoose object to js object and add "id" to it

    if (!place) {
      const error = new HttpError("No Results found for the places id", 404);
      return next(error); //Sending to global error boundary
      // return res.status(404).json({ message: "No Results found" });
    }
  } catch (err) {
    console.log("🚀 --- getPlacesById --- err", err);
    const error = new HttpError(
      "Something went wrong while fetching places",
      422
    );
    return next(error);
  }

  res.json({
    message: "GET Success",
    place,
  });
};

const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  // let places;
  // try {
  //   places = await Place.find({ creator: userId });
  //   places = places.map((place) => place.toObject({ getters: true }));

  //   if (!places || places.length === 0) {
  //     return next(new HttpError("No Results found for the user Id", 404));
  //   }
  // } catch (err) {
  //   const error = new HttpError(
  //     "Something went wrong while fetching places for the user",
  //     422
  //   );
  //   return next(error);
  // }

  // res.json({ message: "GET Success", places });

  //Alternative approach with populate
  let userWithPlaces;
  try {
    userWithPlaces = await User.findById(userId).populate("places");

    if (!userWithPlaces || userWithPlaces.places.length === 0) {
      return next(new HttpError("No Results found for the user Id", 404));
    }
  } catch (err) {
    const error = new HttpError(
      "Something went wrong while fetching places for the user",
      422
    );
    return next(error);
  }

  const places = userWithPlaces.places.map((place) =>
    place.toObject({ getters: true })
  );

  res.json({ message: "GET Success", places });
};

const createPlace = async (req, res, next) => {
  //Validation Check
  const error = validationHandler(req);
  error && next(error);

  const { title, description, address } = req.body;

  let coordinates = {};
  try {
    const results = await getCoordsForAddress(address);

    coordinates.lng = results.features[0].geometry.coordinates[0];
    coordinates.lat = results.features[0].geometry.coordinates[1];
  } catch (error) {
    // console.log("🚀 --- createPlace --- error", error);
    return next(new HttpError("Address not found", 422));
  }

  //Check if user exists
  let user;
  try {
    user = await User.findById(req.userData.userId);

    if (!user) {
      const error = new HttpError("User not found", 422);
      return next(error);
    }
  } catch (err) {
    const error = new HttpError("Error fetching the user", 422);
    return next(error);
  }

  let createdPlace;
  try {
    createdPlace = new Place({
      title,
      description,
      location: coordinates,
      address,
      image: process.env.BACKEND_URL + req.file.path,
      creator: req.userData.userId, //: user.id,
    });

    //Multiple transactions, Success only if all completes or reverts back.
    const session = await mongoose.startSession();
    await session.startTransaction();
    await createdPlace.save({ session });
    user.places.push(createdPlace); //only takes the id, because of schema
    await user.save({ session });
    await session.commitTransaction(); //Save here if all is success.
  } catch (err) {
    const error = new HttpError("Error creating a new place, try again", 422);
    return next(error);
  }

  res.status(201).json({ message: "POST Success", place: createdPlace });
};

const updatePlace = async (req, res, next) => {
  //Validation Check
  const error = validationHandler(req);
  error && next(error);

  const placeId = req.params.pid;
  const { title, description } = req.body;

  let place;
  try {
    place = await Place.findById(placeId);

    if (!place) {
      const error = new HttpError("No Results found for the places id", 404);
      return next(error);
    }
    place.title = title;
    place.description = description;
  } catch (err) {
    const error = new HttpError(
      "Something went wrong while fetching the place",
      422
    );
    return next(error);
  }

  //Auth check
  if (place.creator.toString() !== req.userData.userId) {
    const error = new HttpError(
      "Unauthorized: Not the creator of the place",
      401
    );
    return next(error);
  }

  try {
    await place.save();
    place = place.toObject({ getters: true }); //Convert mongoose object to js object and add "id" to it
  } catch (err) {
    const error = new HttpError(
      "Something went wrong while saving updated place",
      422
    );
    return next(error);
  }

  res.status(201).json({ message: "Update Success", place });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId).populate("creator");
    if (!place) {
      const error = new HttpError("No Results found for the places id", 404);
      return next(error);
    }
  } catch (err) {
    const error = new HttpError(
      "Something went wrong while fetching the place",
      422
    );
    return next(error);
  }

  let image = place.image.split(process.env.BACKEND_URL).pop();

  //Auth check
  if (place.creator.id !== req.userData.userId) {
    const error = new HttpError(
      "Unauthorized: Not the creator of the place",
      401
    );
    return next(error);
  }

  try {
    const session = await mongoose.startSession();
    await session.startTransaction();
    await place.remove({ session });
    place.creator.places.pull(placeId); //Removes the place from user
    await place.creator.save({ session }); // Save the user
    await session.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong while deleting place",
      422
    );
    return next(error);
  }

  //Deleting Image from the server
  fs.unlink(image, (err) => err && console.log("Image Deletion failed"));

  res.status(201).json({ message: "DELETE Success" });
};

//------------------------------------------------------------------
//MARK: Exports
//------------------------------------------------------------------
module.exports = {
  getPlacesById,
  getPlacesByUserId,
  createPlace,
  updatePlace,
  deletePlace,
  /* Validations Exports */
  createPlaceValidator,
  updatePlaceValidator,
};

// Alternative
// exports.getPlacesById = getPlacesById;
// exports.getPlacesByUserId = getPlacesByUserId;
