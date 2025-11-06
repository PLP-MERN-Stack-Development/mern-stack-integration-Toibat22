const Post = require("../models/Post");
const Category = require("../models/Category");
const cloudinary = require("../uploads/cloudinary");

//  GET all posts with pagination + search
exports.getPosts = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1; // current page
    const limit = Number(req.query.limit) || 5; // posts per page
    const search = req.query.search || ""; // search keyword
    const skip = (page - 1) * limit;

    // Search filter: title or content
    const query = search
      ? {
          $or: [
            { title: { $regex: search, $options: "i" } },
            { content: { $regex: search, $options: "i" } }
          ]
        }
      : {};

    const posts = await Post.find(query)
      .populate("category")
      .populate("author", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPosts = await Post.countDocuments(query);

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      totalPosts,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//  GET single post
exports.getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("category")
      .populate("author", "name email")
      .populate("comments.user", "name");

    if (!post) return res.status(404).json({ message: "Post not found" });

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//  CREATE POST (with Cloudinary upload)
exports.createPost = async (req, res) => {
  try {
    const { title, content, author, category, tags } = req.body;

    if (!title || !content || !author || !category) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const slug = title.toLowerCase().replace(/[^\w ]+/g, "").replace(/ +/g, "-");
    const exists = await Post.findOne({ slug });
    if (exists) {
      return res.status(400).json({ message: "A post with this title already exists" });
    }

    const imageUrl = req.file ? req.file.path : "default-post.jpg";

    const post = await Post.create({
      title,
      content,
      author,
      category,
      slug,
      tags: tags ? tags.split(",").map(t => t.trim()) : [],
      featuredImage: imageUrl,
    });

    res.status(201).json(post);
  } catch (error) {
    console.error("Create Post Error:", error);
    res.status(400).json({ message: error.message });
  }
};

//  UPDATE POST
exports.updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { title, tags } = req.body;
    let updateData = { ...req.body };

    if (title) {
      updateData.slug = title.toLowerCase().replace(/[^\w ]+/g, "").replace(/ +/g, "-");
    }

    if (tags && typeof tags === "string") {
      updateData.tags = tags.split(",").map((t) => t.trim());
    }

    if (req.file) {
      updateData.featuredImage = req.file.path;
    }

    const updatedPost = await Post.findByIdAndUpdate(req.params.id, updateData, { new: true });

    res.json(updatedPost);
  } catch (error) {
    console.error("Update Post Error:", error);
    res.status(400).json({ message: error.message });
  }
};

//  DELETE POST
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await post.deleteOne();
    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// LIKE & UNLIKE POST
exports.toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ msg: "Post not found" });

    const userId = req.user._id;
    const alreadyLiked = post.likes.includes(userId);

    if (alreadyLiked) {
      post.likes.pull(userId);
      await post.save();
      return res.json({ message: "Post unliked", likes: post.likes.length });
    } else {
      post.likes.push(userId);
      await post.save();
      return res.json({ message: "Post liked", likes: post.likes.length });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Server error" });
  }
};