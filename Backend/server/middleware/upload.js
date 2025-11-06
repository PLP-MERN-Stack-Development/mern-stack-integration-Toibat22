const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../uploads/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "mern-blog",
    allowed_formats: ["jpg", "png", "jpeg"],
  },
});

const upload = multer({ storage });

module.exports = upload;
