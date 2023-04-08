// module.exports =
class HttpError extends Error {
  constructor(message, errorCode) {
    super(message); // Adds message property
    this.code = errorCode; // Adds code property
  }
}

module.exports = HttpError;
