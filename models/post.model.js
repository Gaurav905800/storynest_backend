const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 180,
    },
    content: { type: String, required: true, minlength: 10 },
    tags: { type: [String], default: [] },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    category: { type: String, required: true, trim: true },
    image: { type: String, default: null },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "published"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Blog = mongoose.model("Blog", blogSchema);

module.exports = { Blog };
