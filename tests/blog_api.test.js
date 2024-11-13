const { describe, test, after, beforeEach } = require("node:test");
const assert = require("node:assert");
const supertest = require("supertest");
const {
  initialBlogs,
  blogNotInDb,
  blogsInDb,
  nonExistingId,
} = require("./test_helper");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const User = require("../models/user");
const Blog = require("../models/blog");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const app = require("../app");

// Wrap up the app with supertest
const api = supertest(app);

// Helper function to get auth token
const getAuthToken = async () => {
  const response = await api
    .post("/api/login/")
    .send({ username: "root", password: "newinset" });
  return response.body.token;
};

beforeEach(async () => {
  // Clear the DB
  console.log("Clearing DB...");
  await Blog.deleteMany({});
  await User.deleteMany({});

  // Create root user
  console.log("Creating root user...");
  const passwordHash = await bcrypt.hash("newinset", 10);
  const user = {
    username: "root",
    passwordHash,
    name: "rootName",
  };
  const userObject = new User(user);
  const savedUser = await userObject.save();

  const blogObjects = initialBlogs.map((blog) => ({
    ...blog,
    user: savedUser.id,
  }));
  const savedBlogs = await Blog.insertMany(blogObjects);

  const blogIds = savedBlogs.map((blog) => blog._id);
  await User.findByIdAndUpdate(
    savedUser.id,
    { blogs: blogIds },
    { new: true, runValidators: true }
  );
});

describe("GET /api/blogs/", () => {
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
});

describe("POST /api/blogs/", () => {
  let token;

  beforeEach(async () => {
    token = await getAuthToken();
  });

  test("creates new blog post with valid data", async () => {
    const blogsBefore = await blogsInDb();

    const response = await api
      .post("/api/blogs/")
      .auth(token, { type: "bearer" })
      .send(blogNotInDb)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const blogsAfter = await blogsInDb();
    assert.strictEqual(blogsAfter.length, blogsBefore.length + 1);

    const savedBlog = { ...response.body };
    delete savedBlog.id;
    delete savedBlog.user;
    assert.deepStrictEqual(savedBlog, blogNotInDb);
  });

  test("defaults missing likes to 0", async () => {
    const blogWithoutLikes = { ...blogNotInDb };
    delete blogWithoutLikes.likes;

    const response = await api
      .post("/api/blogs/")
      .auth(token, { type: "bearer" })
      .send(blogWithoutLikes)
      .expect(201);

    assert.strictEqual(response.body.likes, 0);
  });

  test("rejects blog without title", async () => {
    const blogWithoutTitle = { ...blogNotInDb };
    delete blogWithoutTitle.title;

    await api
      .post("/api/blogs/")
      .auth(token, { type: "bearer" })
      .send(blogWithoutTitle)
      .expect(400);

    const blogsAfter = await blogsInDb();
    assert.strictEqual(blogsAfter.length, initialBlogs.length);
  });

  test("rejects blog without url", async () => {
    const blogWithoutUrl = { ...blogNotInDb };
    delete blogWithoutUrl.url;

    await api
      .post("/api/blogs/")
      .auth(token, { type: "bearer" })
      .send(blogWithoutUrl)
      .expect(400);

    const blogsAfter = await blogsInDb();
    assert.strictEqual(blogsAfter.length, initialBlogs.length);
  });
});

describe("DELETE /api/blogs/", () => {
  let token;

  beforeEach(async () => {
    token = await getAuthToken();
  });

  test("succeeds with valid id", async () => {
    const blogsBefore = await blogsInDb();
    const blogToDelete = blogsBefore[0];

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .auth(token, { type: "bearer" })
      .expect(204);

    const blogsAfter = await blogsInDb();
    assert.strictEqual(blogsAfter.length, blogsBefore.length - 1);
    assert(!blogsAfter.map((b) => b.id).includes(blogToDelete.id));
  });

  test("rejects invalid id", async () => {
    await api
      .delete("/api/blogs/invalid-id")
      .auth(token, { type: "bearer" })
      .expect(400)
      .expect("Content-Type", /application\/json/);
  });
});

describe("PUT /api/blogs/", () => {
  test("succeeds updating likes", async () => {
    const blogsBefore = await blogsInDb();
    const blogToUpdate = { ...blogsBefore[0] };
    blogToUpdate.likes++;

    const response = await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(blogToUpdate)
      .expect(200)
      .expect("Content-Type", /application\/json/);

    const expectedBlog = {
      ...blogToUpdate,
      user: blogToUpdate.user.toString(),
    };
    assert.deepStrictEqual(response.body, expectedBlog);

    const blogsAfter = await blogsInDb();
    assert.strictEqual(blogsAfter.length, blogsBefore.length);
  });

  test("rejects nonexistent id", async () => {
    const id = await nonExistingId();
    await api.put(`/api/blogs/${id}`).send({ title: "just text" }).expect(404);
  });
});

after(async () => {
  console.log("Closing database connection...");
  await mongoose.connection.close();
  await mongoose.disconnect();
});
