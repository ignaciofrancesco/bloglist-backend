const express = require("express");
const mongoose = require("mongoose");
const { MONGODB_URI } = require("./utils/config");
const cors = require("cors");
const blogsRouter = require("./controllers/blogs");

const app = express();

mongoose.connect(MONGODB_URI);

app.use(cors());
app.use(express.json());

app.use("/api/blogs", blogsRouter);

module.exports = app;
