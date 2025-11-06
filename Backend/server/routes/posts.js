const express = require("express");
const { 
  getPosts, 
  getPost, 
  createPost, 
  updatePost, 
  deletePost,
  toggleLike //  Add here
} = require("../controllers/postController");

const { 
  addComment, 
  deleteComment 
} = require("../controllers/commentController");

const upload = require("../middleware/upload");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Public Routes
router.get("/", getPosts);
router.get("/:id", getPost);

// Protected Routes (Posts)
router.post("/", authMiddleware, upload.single("image"), createPost);
router.put("/:id", authMiddleware, upload.single("featuredImage"), updatePost);
router.delete("/:id", authMiddleware, deletePost);

//  LIKE / UNLIKE Route
router.put("/:id/like", authMiddleware, toggleLike);

//  Comments Routes
router.post("/:postId/comment", authMiddleware, addComment);
router.delete("/:postId/comment/:commentId", authMiddleware, deleteComment);

module.exports = router;