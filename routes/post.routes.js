const { Router } = require("express");
const upload = require("../middleware/upload");
const {
  createBlog,
  getBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  toggleLikeBlog,
} = require("../controllers/post.controller");
const { verifyToken } = require("../middleware/auth");

const router = Router();

router.post("/", verifyToken, upload.single("image"), createBlog);
router.get("/", getBlogs);
router.get("/:id", getBlogById);
router.patch("/:id", verifyToken, upload.single("image"), updateBlog);
router.delete("/:id", verifyToken, deleteBlog);
router.post("/:id/toggle-like", verifyToken, toggleLikeBlog);

module.exports = router;
