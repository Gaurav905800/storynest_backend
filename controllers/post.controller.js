const { Blog } = require("../models/post.model");
const imagekit = require("../config/imagekit");

const createBlog = async (req, res) => {
  try {
    const { title, content, tags, category } = req.body;
    let uploadedImageUrl = null;
    if (req.file) {
      const base64Image = req.file.buffer.toString("base64");
      const mimeType = req.file.mimetype;

      const uploadResponse = await imagekit.upload({
        file: `data:${mimeType};base64,${base64Image}`,
        fileName: `blog_${Date.now()}`,
        folder: "/storynet/blogs",
      });

      uploadedImageUrl = uploadResponse.url;
    } else if (req.body.image && req.body.image.startsWith("data:image")) {
      const uploadResponse = await imagekit.upload({
        file: req.body.image,
        fileName: `blog_${Date.now()}`,
        folder: "/storynet/blogs",
      });

      uploadedImageUrl = uploadResponse.url;
    }

    const blog = await Blog.create({
      title,
      content,
      tags,
      category,
      image: uploadedImageUrl,
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

    res.json({
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
    res.status(500).json({ success: false, message: err.message });
  }
};

const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog)
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });

    res.json({ success: true, data: blog });
  } catch (err) {
    res.status(400).json({ success: false, message: "Invalid ID" });
  }
};

const updateBlog = async (req, res) => {
  try {
    const { title, content, tags, category } = req.body;

    let uploadedImageUrl = null;

    if (req.file) {
      const base64Image = req.file.buffer.toString("base64");
      const mimeType = req.file.mimetype;

      const uploadResponse = await imagekit.upload({
        file: `data:${mimeType};base64,${base64Image}`,
        fileName: `blog_${Date.now()}`,
        folder: "/storynet/blogs",
      });

      uploadedImageUrl = uploadResponse.url;
    } else if (req.body.image && req.body.image.startsWith("data:image")) {
      const uploadResponse = await imagekit.upload({
        file: req.body.image,
        fileName: `blog_${Date.now()}`,
        folder: "/storynet/blogs",
      });

      uploadedImageUrl = uploadResponse.url;
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      req.params.id,
      {
        title,
        content,
        tags,
        category,
        ...(uploadedImageUrl && { image: uploadedImageUrl }),
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "Blog updated",
      data: updatedBlog,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Delete Blog
const deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog)
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });

    if (req.user.id !== blog.author.toString()) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    await blog.deleteOne();

    res.json({ success: true, message: "Blog deleted" });
  } catch (err) {
    res.status(400).json({ success: false, message: "Invalid ID" });
  }
};

const toggleLikeBlog = async (req, res) => {
  try {
    const blogId = req.params.id;
    const userId = req.user.id;

    const blog = await Blog.findById(blogId);

    if (!blog) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }

    const alreadyLiked = blog.likedUsers.includes(userId);

    if (alreadyLiked) {
      blog.likedUsers = blog.likedUsers.filter(
        (id) => id.toString() !== userId
      );
    } else {
      blog.likedUsers.push(userId);
    }

    blog.likes = blog.likedUsers.length;
    await blog.save();

    return res.json({
      success: true,
      message: alreadyLiked ? "Blog unliked" : "Blog liked",
      likes: blog.likes,
      likedUsers: blog.likedUsers,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: err.message || "Server error" });
  }
};

module.exports = {
  createBlog,
  getBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  toggleLikeBlog,
};
