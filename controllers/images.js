const path = require("path");
const Image = require("../models/image");
const fs = require("fs");
const ApiError = require("../utils/ApiError");

async function get(req, res, next) {
  const { id } = req.params;

  const limit = parseInt(req.query.limit || 0);
  const skip = parseInt(req.query.skip || 0);

  await Image.find({ creatorID: id })
    .skip(skip)
    .limit(limit)
    .populate("author", "name avatar")
    .sort("-createdAt")
    .exec((err, image) => {
      if (err) return next(new ApiError("Something went wrong", 400));
      res.status(200).json(image);
    });
}
module.exports.getImages = get;

async function getById(req, res) {
  await Image.findById(req.params.id, (err, image) => {
    if (err) return next(new ApiError("Something went wrong", 400));
    res.status(200).json(image);
  });
}
module.exports.getImageById = getById;

function create(req, res) {
  const remove = path.join(__dirname, "..", "uploads");

  const relPath = req.file.path.replace(remove, "");

  const newImage = new Image(req.body);
  newImage.creatorID = req.userID;
  newImage.path = relPath;
  newImage.save((err, image) => {
    if (err) return next(new ApiError("Something went wrong", 400));
    Image.findById(image._id)
      .populate({
        path: "author",
        model: "User",
        select: "name avatar",
      })
      .exec((err, image) => {
        if (err) return next(new ApiError("Something went wrong", 400));
        return res.status(201).json(image);
      });
  });
}
module.exports.uploadImage = create;

function destroy(req, res, next) {
  Image.findById(req.params.id, (err, image) => {
    if (err) return next(new ApiError("Something went wrong", 400));
    if (!image) return next(new ApiError("Image doesnt exists", 404));

    if (req.userID.toString() !== image.creatorID.toString())
      return next(new ApiError("Access denied", 401));

    Image.deleteOne({ _id: image._id }, function (err, image) {
      if (err) return next(new ApiError("Something went wrong", 400));
      return;
    });

    const lastIndex = image.path.lastIndexOf("\\");
    const remove = path.join(
      __dirname,
      "..",
      "uploads",
      `${image.path.substring(0, lastIndex)}`
    );

    try {
      fs.rmdirSync(remove, { recursive: true });
    } catch (err) {
      return next(new ApiError("Error while deleting", 400));
    }
    res.status(200).json(image);
  });
}
module.exports.deleteImage = destroy;

function like(req, res, next) {
  Image.findById(req.params.id, (err, image) => {
    if (err) return next(new ApiError("Something went wrong", 400));
    if (!image) return next(new ApiError("Image not found", 404));

    const isUserLike = image.likes.findIndex(
      (user) => user._id.toString() === req.userID.toString()
    );

    if (isUserLike > -1) {
      image.likes.pull(req.userID);
    } else image.likes.push(req.userID);
    image.save();

    return res.status(200).json(image);
  }).populate("author", "name avatar");
}
module.exports.toggleLike = like;
