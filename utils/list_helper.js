const _ = require("lodash");

const dummy = (blogs) => {
  return 1;
};

const totalLikes = (blogs) => {
  return blogs.reduce((sum, blog) => {
    return sum + blog.likes;
  }, 0);
};

const favoriteBlog = (blogs) => {
  if (blogs.length === 0) {
    return null;
  }

  const favBlog = blogs.reduce((favSoFar, currentBlog) => {
    return favSoFar.likes >= currentBlog.likes ? favSoFar : currentBlog;
  });

  return favBlog;
};

const mostBlogs = (blogs) => {
  if (blogs.length === 0) {
    return null;
  }

  // Create an object to track down the number of blogs by author
  let blogCountByAuthor = {};
  // Variable to save the max author
  let maxAuthor = null;

  blogs.forEach((blog) => {
    // Update the author count, or create the author count if it doesn t exist
    blogCountByAuthor[blog.author] = (blogCountByAuthor[blog.author] || 0) + 1;

    // If there is still no max author, or if the current author is greater than the max, update
    if (
      !maxAuthor ||
      blogCountByAuthor[blog.author] > blogCountByAuthor[maxAuthor]
    ) {
      maxAuthor = blog.author;
    }
  });

  return {
    author: maxAuthor,
    blogs: blogCountByAuthor[maxAuthor],
  };
};

const mostLikes = (blogs) => {
  if (blogs.length === 0) {
    return null;
  }

  // group blogs by author
  const authorsBlogs = _.groupBy(blogs, (b) => {
    return b.author;
  });
  /* 
  {
    "author 1": [{blog a}, {blog b}],
    "author 2": [{blog c}, {blog d}]
  }
   */

  // Compute total likes for each author
  const authorsLikes = _.mapValues(authorsBlogs, (ab) => {
    return ab.reduce((totalLikes, currentBlog) => {
      return totalLikes + currentBlog.likes;
    }, 0);
  });

  /* 
  {
    'Michael Chan': 7,
    'Edsger W. Dijkstra': 17,
    'Robert C. Martina': 10,
    'Robert C. Martine': 0,
    'Robert C. Martin': 2
  }
   */

  // Pick the one with the max likes
  const authors = _.keys(authorsLikes);
  const maxLikesAuthor = _.maxBy(authors, (a) => {
    return authorsLikes[a];
  });
  /* 
    "author"
  */

  const result = {
    author: maxLikesAuthor,
    likes: authorsLikes[maxLikesAuthor],
  };

  return result;
};

/////

const blogs = [
  {
    _id: "5a422a851b54a676234d17f7",
    title: "React patterns",
    author: "Michael Chan",
    url: "https://reactpatterns.com/",
    likes: 7,
    __v: 0,
  },
  {
    _id: "5a422aa71b54a676234d17f8",
    title: "Go To Statement Considered Harmful",
    author: "Edsger W. Dijkstra",
    url: "http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html",
    likes: 5,
    __v: 0,
  },
  {
    _id: "5a422b3a1b54a676234d17f9",
    title: "Canonical string reduction",
    author: "Edsger W. Dijkstra",
    url: "http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html",
    likes: 12,
    __v: 0,
  },
  {
    _id: "5a422b891b54a676234d17fa",
    title: "First class tests",
    author: "Robert C. Martina",
    url: "http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.htmll",
    likes: 10,
    __v: 0,
  },
  {
    _id: "5a422ba71b54a676234d17fb",
    title: "TDD harms architecture",
    author: "Robert C. Martine",
    url: "http://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture.html",
    likes: 0,
    __v: 0,
  },
  {
    _id: "5a422bc61b54a676234d17fc",
    title: "Type wars",
    author: "Robert C. Martin",
    url: "http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html",
    likes: 2,
    __v: 0,
  },
];

const oneBlog = [
  {
    _id: "5a422a851b54a676234d17f7",
    title: "React patterns",
    author: "Michael Chan",
    url: "https://reactpatterns.com/",
    likes: 7,
    __v: 0,
  },
];

console.log(mostLikes(oneBlog));

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes,
};
