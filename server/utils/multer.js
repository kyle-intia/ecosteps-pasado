const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg"];

const fileFilter = (req, file, cb) => {
  if (!allowedMimeTypes.includes(file.mimetype)) {
    cb(new Error("Only jpg, jpeg, and png files are allowed!"), false);
  } else {
    cb(null, true);
  }
};

const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "profile_pics",
    allowed_formats: ["jpg", "jpeg", "png"],
  },
});

const uploadProfilePic = multer({
  storage: profileStorage,
  fileFilter,
});

const communityStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "community_posts",
    allowed_formats: ["jpg", "jpeg", "png"],
  },
});

const uploadCommunityImage = multer({
  storage: communityStorage,
  fileFilter,
});

module.exports = {
  uploadProfilePic,
  uploadCommunityImage,
};
