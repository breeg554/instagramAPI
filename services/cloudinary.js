const cloudinary = require("cloudinary").v2;
const config = require("../config/cloudinary");
cloudinary.config({
  cloud_name: config.cloud_name,
  api_key: config.api_key,
  api_secret: config.api_secret,
});

module.exports = cloudinary;
