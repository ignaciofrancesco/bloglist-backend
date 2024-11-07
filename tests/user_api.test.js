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

describe.only("The creation of a user", () => {
  test.only("fails when username is not valid and returns proper status code en error message.", async () => {
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

  test.only("fails when password is invalid, with proper status code en error message", async () => {
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

/////////////////////

describe("The blog api", () => {
  test("all blogs are returned as json", async () => {
    const response = await api
      .get("/api/blogs/")
      .expect(200) // checks de response
      .expect("Content-Type", /application\/json/); // checks the response

    // Inside the response there is the body with the data
    assert.strictEqual(response.body.length, initialBlogs.length);
  });

  test("the unique identifier property of the blog posts is named 'id'", async () => {
    const blogs = await blogsInDb();

    for (let blog of blogs) {
      assert(blog.hasOwnProperty("id"));

      const blogsFound = await Blog.find({
        _id: blog.id,
      });
      assert.strictEqual(blogsFound.length, 1);
    }
  });

  test("POST request creates a new blog post.", async () => {
    // Prepare
    const blogsBefore = await blogsInDb();

    // Test
    response = await api
      .post("/api/blogs/")
      .send(blogNotInDb)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const blogsAfter = await blogsInDb();

    // Assert
    assert.strictEqual(blogsAfter.length, blogsBefore.length + 1);
    let savedBlog = response.body;
    delete savedBlog.id;

    assert.deepStrictEqual(savedBlog, blogNotInDb);
  });

  test("if likes property is missing in the request, it defaults to value 0.", async () => {
    // Arrange
    let blogWithoutLikesProperty = blogNotInDb;
    delete blogWithoutLikesProperty.likes;

    // Act
    response = await api
      .post("/api/blogs/")
      .send(blogWithoutLikesProperty)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const savedBlog = response.body;

    // Assert
    assert.strictEqual(!blogWithoutLikesProperty.hasOwnProperty("likes"), true);
    assert.strictEqual(savedBlog.likes, 0);
  });

  test("if title is missing in the request, backend responds with 400 bad request.", async () => {
    // Arrange
    let blogWithoutTitle = { ...blogNotInDb };
    delete blogWithoutTitle.title;

    // Act && Assert
    responseTitle = await api
      .post("/api/blogs/")
      .send(blogWithoutTitle)
      .expect(400);

    const blogsAfter = await blogsInDb();

    assert.strictEqual(initialBlogs.length, blogsAfter.length);
  });

  test("if url is missing in the request, backend responds with 400 bad request.", async () => {
    // Arrange
    let blogWithoutUrl = { ...blogNotInDb };
    delete blogWithoutUrl.url;

    // Act && Assert
    responseUrl = await api
      .post("/api/blogs/")
      .send(blogWithoutUrl)
      .expect(400);

    const blogsAfter = await blogsInDb();

    assert.strictEqual(initialBlogs.length, blogsAfter.length);
  });

  describe("when deleting", () => {
    test("succeds with valid id", async () => {
      // Arrange
      const blogsBefore = await blogsInDb();
      const blogToDelete = blogsBefore[0];

      // Act
      const result = await api
        .delete(`/api/blogs/${blogToDelete.id}`)
        .expect(204);

      const blogsAfter = await blogsInDb();
      const blogsAfterIds = blogsAfter.map((b) => {
        return b.id;
      });

      // Assert
      // The size of the list is decreased by 1
      assert.strictEqual(blogsAfter.length, blogsBefore.length - 1);
      // The list doesnt contain the deleted blog
      assert.strictEqual(blogsAfterIds.includes(blogToDelete.id), false);
    });

    test("rejects with 400 when id is invalid", async () => {
      // Arrange
      const invalidId = "xxxxx";
      // Act && assert
      await api
        .delete(`/api/blogs/${invalidId}`)
        .expect(400)
        .expect("Content-Type", /application\/json/);
    });
  });

  describe("when updating", () => {
    test("succeeds with valid id", async () => {
      // Arrange
      const blogsBefore = await blogsInDb();
      const blogToUpdate = blogsBefore[0];
      blogToUpdate.likes++;

      // Act
      const response = await api
        .put(`/api/blogs/${blogToUpdate.id}`)
        .send(blogToUpdate)
        .expect(200)
        .expect("Content-Type", /application\/json/);

      const updatedBlog = response.body;

      const blogsAfter = await blogsInDb();

      // Assert
      // The size of the list doesn't change
      assert.strictEqual(blogsAfter.length, blogsBefore.length);
      // the updated blog contains the updated values
      assert.deepStrictEqual(updatedBlog, {
        ...blogToUpdate,
        likes: blogToUpdate.likes++,
      });
    });

    test("rejects with status code 404 if not found", async () => {
      // Arrange
      const id = await nonExistingId();

      // Act
      const reponse = await api
        .put(`/api/blogs/${id}`)
        .send({ title: "just text" })
        .expect(404);
    });
  });
});

after(async () => {
  console.log("Closing database connection...");
  await mongoose.connection.close();
});
