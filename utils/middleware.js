const jwt = require("jsonwebtoken");
const User = require("../models/user");

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: "unknown endpoint" });
};

const errorHandler = (error, request, response, next) => {
  console.log(error.message);

  if (error.name === "CastError") {
    return response.status(400).send({ error: "malformatted id" });
  } else if (error.name === "ValidationError") {
    return response.status(400).json({ error: error.message });
  } else if (
    error.name === "MongoServerError" &&
    error.message.includes("E11000 duplicate key error")
  ) {
    return response
      .status(400)
      .json({ error: "expected `username` to be unique" });
  } else if (error.name === "JsonWebTokenError") {
    return response.status(401).json({ error: "token invalid" });
  } else if (error.name === "TokenExpiredError") {
    return response.status(401).json({
      error: "token expired",
    });
  }

  next(error);
};

/*  Isolates token from Authorization header */
const tokenExtractor = (request, response, next) => {
  const authorization = request.get("authorization");

  if (authorization && /^Bearer /i.test(authorization)) {
    request.token = authorization.replace(/^Bearer /i, "");
  } else {
    request.token = null;
  }
  next();
};

const userExtractor = async (request, response, next) => {
  const token = request.token;

  if (!token) {
    return response.status(401).json({ error: "Unauthorized: Token missing" });
  }

  const decodedToken = jwt.verify(token, process.env.SECRET);

  if (!decodedToken.id) {
    return response.status(401).json({ error: "Unauthorized: Invalid token" });
  }

  const user = await User.findById(decodedToken.id);

  if (!user) {
    return response.status(404).json({ error: "Unauthorized: User not found" });
  }

  request.user = user;
  next();
};

module.exports = {
  unknownEndpoint,
  errorHandler,
  tokenExtractor,
  userExtractor,
};
