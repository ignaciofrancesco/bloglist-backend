const middleware = require("../utils/middleware");
const blogsRouter = require("express").Router();
const mongoose = require("mongoose");
const Blog = require("../models/blog");
const Comment = require("../models/comment");

// Get all blogs
blogsRouter.get("/", async (request, response) => {
  const blogs = await Blog.find({})
    .populate("user", {
      username: 1,
      name: 1,
      id: 1,
    })
    .populate("comments", {
      content: 1,
      id: 1,
    });
  return response.json(blogs);
});

// Add a new blog
blogsRouter.post("/", middleware.userExtractor, async (request, response) => {
  let blog = request.body;
  const user = request.user;

  if (!blog.title || !blog.url) {
    return response.status(400).end();
  }

  if (!blog.hasOwnProperty("likes")) {
    blog.likes = 0;
  }

  // If everything is valid, then create blog

  // Assign user id to blog
  blog.user = user.id;

  const blogMongoose = new Blog(blog);

  savedBlog = await blogMongoose.save();

  // Add blog id to user's blogs array
  user.blogs = user.blogs.concat(savedBlog.id);

  savedUser = await user.save();

  const savedBlogPopulated = await Blog.findById(savedBlog.id)
    .populate("user", {
      username: 1,
      name: 1,
      id: 1,
    })
    .populate("comments", { content: 1, id: 1 });

  return response.status(201).json(savedBlogPopulated);
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
    user: body.user.id,
  };

  // Process data
  const updatedBlog = await Blog.findByIdAndUpdate(blogId, blog, {
    new: true,
  })
    .populate("user", {
      username: 1,
      name: 1,
      id: 1,
    })
    .populate("comments", { content: 1, id: 1 });

  if (!updatedBlog) {
    return response.status(404).json({ error: "Not found: Object not found." });
  }

  // Send response
  return response.json(updatedBlog);
});

// Delete a blog by id
blogsRouter.delete(
  "/:id",
  middleware.userExtractor,
  async (request, response) => {
    // Get data from the request
    const blogId = request.params.id;
    const user = request.user;

    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      return response.status(400).json({ error: "Bad request: invalid id" });
    }

    // Find the blog
    const blog = await Blog.findById(blogId);

    if (blog.user.toString() !== user.id.toString()) {
      return response.status(401).json({
        error: "Unauthorized: cannot delete a blog that is not yours.",
      });
    }

    const result = await blog.deleteOne();

    // Return response
    return response.status(204).end();
  }
);

// Post a comment
blogsRouter.post("/:id/comments", async (request, response) => {
  // Get data from the request
  const blogId = request.params.id;
  const body = request.body;

  // Validate that has content
  if (!body.content) {
    return response.status(400).end();
  }

  // Create and save new comment
  const newComment = {
    content: body.content,
    blog: blogId,
  };
  const commentMongoose = new Comment(newComment);
  savedComment = await commentMongoose.save();

  // Get the correspondent blog
  const blog = await Blog.findById(blogId);
  blog.comments.push(savedComment.id);

  const updatedBlog = await Blog.findByIdAndUpdate(blog.id, blog, {
    new: true,
  }).populate("comments", {
    content: 1,
    id: 1,
  });

  // Send response
  return response.status(201).json(updatedBlog);
});

module.exports = blogsRouter;
