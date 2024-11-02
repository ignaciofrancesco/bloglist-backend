const blogsRouter = require("express").Router();
const Blog = require("../models/blog");

blogsRouter.get("/", async (request, response) => {
  const blogs = await Blog.find({});
  response.json(blogs);
});

blogsRouter.post("/", async (request, response) => {
  let blog = request.body;

  if (!blog.title || !blog.url) {
    response.status(400).end();
    return;
  }

  if (!blog.hasOwnProperty("likes")) {
    blog.likes = 0;
  }

  const blogMongoose = new Blog(blog);

  savedBlog = await blogMongoose.save();

  response.status(201).json(savedBlog);
});

module.exports = blogsRouter;
