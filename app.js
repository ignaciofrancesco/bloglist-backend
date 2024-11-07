const express = require("express");
const mongoose = require("mongoose");
const { MONGODB_URI } = require("./utils/config");
const cors = require("cors");
const usersRouter = require("./controllers/users");
const blogsRouter = require("./controllers/blogs");

const app = express();

// DB connection
mongoose.connect(MONGODB_URI);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/users", usersRouter);
app.use("/api/blogs", blogsRouter);

module.exports = app;
