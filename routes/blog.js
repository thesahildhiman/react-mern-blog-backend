const express = require("express");
const { default: mongoose } = require("mongoose");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Blog = require("../models/blog");
const checkAuthMiddleware = require("../middlewares/checkAuth");
const User = require("../models/user");

const checkOwnershipMiddleware = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);
    console.log(">>>>>>>>>>>>", req.userId, "-------", blog.owner.toString());
    if (!blog) {
      return res.status(404).json({ message: "blog not found" });
    }
    if (blog.owner.toString() !== req.userId) {
      return res
        .status(403)
        .json({ message: "user not have access to update/delete this blog" });
    }
    req.blog = blog;
    next();
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

router.post("/create", checkAuthMiddleware, async (req, res) => {
  try {
    const { title, description, image } = req.body;
    const blog = new Blog({ title, description, image, owner: req.userId });
    await blog.save();

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }
    user.blogs.push(blog._id);
    await user.save();

    res.status(201).json({ message: "blog created successfully", blog });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "blog not found" });
    }

    return res.status(200).json(blog);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.put(
  "/update/:id",
  checkAuthMiddleware,
  checkOwnershipMiddleware,
  async (req, res) => {
    const { title, description, image } = req.body;
    const updateBlog = await Blog.findOneAndUpdate(
      req.params.id,
      { title, description, image },
      { new: true }
    );

    if (!updateBlog) {
      return res.status(404).json({ message: "blog not found" });
    }

    return res
      .status(200)
      .json({ message: "blog update successfully", updateBlog });
  }
);

router.delete(
  "/delete/:id",
  checkAuthMiddleware,
  checkOwnershipMiddleware,
  async (req, res) => {
    try {
      const deletedBlog = await Blog.findByIdAndDelete(req.params.id);
      console.log("deletedBlog-----", deletedBlog);
      if (!deletedBlog) {
        return res.status(404).json({ message: "blog not found" });
      }
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ message: "user not found" });
      }
      user.blogs.pull(new mongoose.Types.ObjectId(req.params.id));
      await user.save();
      return res
        .status(200)
        .json({ message: "blog deleted successfully", deletedBlog });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }
);

router.post("/search", async (req, res) => {
  try {
    const search = req.body.search || "";
    const page = parseInt(req.body.page || 1);
    const perPage = 10;
    const searchQuery = new RegExp(search, "i");
    const totalBlogs = await Blog.countDocuments({ title: searchQuery });
    console.log(">>>>>>", searchQuery, totalBlogs);
    const totalPages = Math.ceil(totalBlogs / perPage);
    if (page < 1 || page > totalPages) {
      return res.status(400).json({ message: "invalid page number" });
    }
    // skip blogs if user jumps to any page number
    const skip = (page - 1) * perPage;
    const blogs = await Blog.find({ title: searchQuery })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(perPage);
    return res.status(200).json({ message: "blogs search result", blogs });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;
