const multer = require("multer");
const uuid = require("uuid").v1;

//Extn types
const MIME_TYPES = {
  "image/png": "png",
  "image/jpg": "jpg",
  "image/jpeg": "jpeg",
};

const uploader = multer({
  limits: 50000, //bytes
  //File Validation
  fileFilter: (req, file, callback) => {
    const isFileValid = !!MIME_TYPES[file.mimetype];
    const error = isFileValid ? null : new Error("File is not valid");
    callback(error, isFileValid);
  },
  storage: multer.diskStorage({
    //Creating the file
    filename: (req, file, callback) => {
      const extn = MIME_TYPES[file.mimetype]; //extract the file etxn
      callback(null, uuid() + "." + extn);
    },
    //Saving the file
    destination: (req, file, callback) => {
      const storagePath = "uploads/images"; //Stored inside the project server
      callback(null, storagePath);
    },
  }),
});

const fileUpload = uploader.single("image");

module.exports = fileUpload;
