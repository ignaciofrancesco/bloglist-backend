const { describe, test, after, beforeEach } = require("node:test");
const assert = require("node:assert");
const supertest = require("supertest");
const helper = require("./test_helper");
const mongoose = require("mongoose");
const User = require("../models/user");
const app = require("../app");

// Wrap up the app with supertest
const api = supertest(app);

beforeEach(async () => {
  // Clear the DB
  console.log("Clearing database...");
  await User.deleteMany({});

  console.log("Populating database...");

  const user = {
    username: "root",
    password: "newinset",
    name: "rootName",
  };

  // Save one user
  let userObject = new User(user);
  // This will wait for the operation, and just then it will go on
  await userObject.save();
});

describe("The creation of a user", () => {
  test("fails when username is not valid and returns proper status code en error message.", async () => {
    // Arrange
    const usersAtStart = await helper.usersInDb();
    const newUser = {
      username: "ac",
      password: "longpassword",
      name: "Jhon",
    };

    // Act && Assert
    const response = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    assert(response.body.error.includes("minimum allowed length (3)"));

    const usersAtEnd = await helper.usersInDb();
    assert(usersAtEnd.length === usersAtStart.length);
  });

  test("fails when password is invalid, with proper status code en error message", async () => {
    // Arrange
    const usersAtStart = await helper.usersInDb();
    const newUser = {
      username: "Properusername",
      password: "sh",
      name: "Jhon",
    };

    // Act && Assert
    const response = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    assert(
      response.body.error.includes(
        "Password is mandatory to be 3 chars or longer"
      )
    );

    const usersAtEnd = await helper.usersInDb();
    assert(usersAtEnd.length === usersAtStart.length);
  });
});
after(async () => {
  await mongoose.connection.close();
});
