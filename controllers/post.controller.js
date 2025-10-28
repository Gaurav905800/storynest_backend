const { Blog } = require("../models/post.model");
const fs = require("fs");
const imagekit = require("../config/imagekit");

const getBaseUrl = (req) => {
  const proto = req.headers["x-forwarded-proto"] || req.protocol;
  return `${proto}://${req.get("host")}`;
};

const createBlog = async (req, res) => {
  try {
    const { title, content, tags, category } = req.body;

    let image = req.body.image || null;
    if (req.file) {
      const uploadResponse = await imagekit.upload({
        file: fs.readFileSync(req.file.path),
        fileName: req.file.originalname,
        folder: "/storynet/blogs",
      });

      image = uploadResponse.url; // hosted image URL
      fs.unlinkSync(req.file.path); // delete temp file
    }

    const blog = await Blog.create({
      title,
      content,
      tags,
      category,
      image,
      author: req.user.id,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Blog submitted for review",
      data: blog,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const getBlogs = async (req, res) => {
  try {
    const { q, category, tag, published, page = 1, limit = 10 } = req.query;
    const filters = {};
    if (q) {
      filters.$or = [
        { title: { $regex: q, $options: "i" } },
        { content: { $regex: q, $options: "i" } },
      ];
    }
    if (category) filters.category = category;
    if (tag) filters.tags = tag;
    if (typeof published !== "undefined")
      filters.published = published === "true";

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Blog.find(filters)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Blog.countDocuments(filters),
    ]);

    return res.json({
      success: true,
      data: items,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Read one
const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog)
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    return res.json({ success: true, data: blog });
  } catch (err) {
    return res.status(400).json({ success: false, message: "Invalid ID" });
  }
};

const updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog)
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });

    if (req.user.id !== blog.author.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    const updates = { ...req.body };

    if (req.file) {
      const relativePath = req.file.path.replace(/\\/g, "/");
      updates.image = `${getBaseUrl(req)}/${relativePath}`;
    }

    const updated = await Blog.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
};

const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (req.user.id !== blog.author.toString()) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    if (!blog)
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    return res.json({ success: true, message: "Blog deleted" });
  } catch (err) {
    return res.status(400).json({ success: false, message: "Invalid ID" });
  }
};

module.exports = {
  createBlog,
  getBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
};
