const blogsRouter = require("express").Router();
const mongoose = require("mongoose");
const Blog = require("../models/blog");

// Get all blogs
blogsRouter.get("/", async (request, response) => {
  const blogs = await Blog.find({});
  return response.json(blogs);
});

// Add a new blog
blogsRouter.post("/", async (request, response) => {
  let blog = request.body;

  if (!blog.title || !blog.url) {
    return response.status(400).end();
  }

  if (!blog.hasOwnProperty("likes")) {
    blog.likes = 0;
  }

  const blogMongoose = new Blog(blog);

  savedBlog = await blogMongoose.save();

  return response.status(201).json(savedBlog);
});

// Update a blog post by id
blogsRouter.put("/:id", async (request, response) => {
  // Get data from the request
  const blogId = request.params.id;
  const body = request.body;
  const blog = {
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes,
  };

  // Process data
  const updatedBlog = await Blog.findByIdAndUpdate(blogId, blog, { new: true });

  if (!updatedBlog) {
    return response.status(404).json({ error: "Object not found." });
  }

  // Send response
  return response.json(updatedBlog);
});

// Delete a blog by id
blogsRouter.delete("/:id", async (request, response) => {
  // Get data from the request
  const id = request.params.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return response.status(400).json({ error: "Bad request: invalid id" });
  }

  // Process data
  const result = await Blog.findByIdAndDelete(id);

  // Return response
  return response.status(204).end();
});

module.exports = blogsRouter;
