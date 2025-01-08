const router = require("express").Router();
const Blog = require("../models/blog");
const User = require("../models/user");

router.post("/reset", async (request, response) => {
  // Delete all blogs
  await Blog.deleteMany({});
  // Delete all users
  await User.deleteMany({});

  response.status(204).end();
});

module.exports = router;
