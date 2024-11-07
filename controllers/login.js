const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const loginRouter = require("express").Router();
const User = require("../models/user");

loginRouter.post("/", async (request, response) => {
  const { username, password } = request.body;

  if (!password || !username) {
    return response
      .status(401)
      .json({ error: "Username and password are required." });
  }

  const user = await User.findOne({ username });

  if (!user) {
    return response.status(404).json({ error: "Username not found." });
  }

  console.log(password, user);

  const passwordCorrect = await bcrypt.compare(password, user.passwordHash);

  if (!passwordCorrect) {
    return response.status(401).json({ error: "Password is invalid." });
  }

  // If everything is valid, then create token and send it over

  const userForToken = {
    username: user.username,
    id: user.id,
  };

  const token = jwt.sign(userForToken, process.env.SECRET);

  return response
    .status(200)
    .send({ token, username: user.username, name: user.name });
});

module.exports = loginRouter;
