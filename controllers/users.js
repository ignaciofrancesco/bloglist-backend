const bcrypt = require("bcrypt");
const usersRouter = require("express").Router();
const mongoose = require("mongoose");
const User = require("../models/user");

// Get all users
usersRouter.get("/", async (request, response) => {
  const users = await User.find({});
  return response.json(users);
});

// Add a new user
usersRouter.post("/", async (request, response) => {
  const { username, password, name } = request.body;

  if (!password || password.length < 3) {
    return response
      .status(400)
      .json({ error: "Password is mandatory to be 3 chars or longer." });
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const user = new User({
    username,
    passwordHash,
    name,
  });

  const savedUser = await user.save();

  response.status(201).json(savedUser);
});

module.exports = usersRouter;

// Update a blog post by id
// usersRouter.put("/:id", async (request, response) => {
//   // Get data from the request
//   const blogId = request.params.id;
//   const body = request.body;
//   const blog = {
//     title: body.title,
//     author: body.author,
//     url: body.url,
//     likes: body.likes,
//   };

//   // Process data
//   const updatedUser = await User.findByIdAndUpdate(blogId, blog, { new: true });

//   if (!updatedUser) {
//     return response.status(404).json({ error: "Object not found." });
//   }

//   // Send response
//   return response.json(updatedUser);
// });

// Delete a blog by id
// usersRouter.delete("/:id", async (request, response) => {
//   // Get data from the request
//   const id = request.params.id;

//   if (!mongoose.Types.ObjectId.isValid(id)) {
//     return response.status(400).json({ error: "Bad request: invalid id" });
//   }

//   // Process data
//   const result = await User.findByIdAndDelete(id);

//   // Return response
//   return response.status(204).end();
// });
