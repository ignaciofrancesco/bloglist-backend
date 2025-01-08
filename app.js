const express = require("express");
const mongoose = require("mongoose");
const { MONGODB_URI } = require("./utils/config");
const cors = require("cors");
require("express-async-errors");
const loginRouter = require("./controllers/login");
const usersRouter = require("./controllers/users");
const blogsRouter = require("./controllers/blogs");
const middleware = require("./utils/middleware");

const app = express();

// DB connection
mongoose.connect(MONGODB_URI);

// Middleware 1
app.use(middleware.tokenExtractor);
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/login", loginRouter);
app.use("/api/users", usersRouter);
app.use("/api/blogs", blogsRouter);

if (process.env.NODE_ENV === "test") {
  const testingRouter = require("./controllers/testing");
  app.use("/api/testing", testingRouter);
}

// Middleware 2
app.use(middleware.unknownEndpoint);
app.use(middleware.errorHandler);

module.exports = app;
