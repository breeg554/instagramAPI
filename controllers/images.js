const path = require("path");
const Image = require("../models/image");
const fs = require("fs");
const ApiError = require("../utils/ApiError");
const cloudinary = require("../services/cloudinary");

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

function create(req, res, next) {
  const { file } = req;

  const newImage = new Image(req.body);
  newImage.creatorID = req.userID;
  newImage.path = file.path;
  newImage.publicID = file.filename.substring(file.filename.indexOf("/") + 1);
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
  Image.findById(req.params.id, async (err, image) => {
    if (err) return next(new ApiError("Something went wrong", 400));
    if (!image) return next(new ApiError("Image doesnt exists", 404));

    if (req.userID.toString() !== image.creatorID.toString())
      return next(new ApiError("Access denied", 401));

    await cloudinary.uploader.destroy(
      `instaApp/${image.publicID}`,
      (err, result) => {
        if (err) return next(new ApiError("Image doesnt exists", 404));
        Image.deleteOne({ _id: image._id }, async (err) => {
          if (err) return next(new ApiError("Something went wrong", 400));
        });
      }
    );
    res.status(200).json(image);

    // console.log(image);
    // cloudinary.uploader.destroy("sample", (error, result) => {
    //   console.log(result, error);
    // });
    // const lastIndex = image.path.lastIndexOf("\\");
    // const remove = path.join(
    //   __dirname,
    //   "..",
    //   "uploads",
    //   `${image.path.substring(0, lastIndex)}`
    // );
    // console.log(remove);
    // try {
    //   fs.rmdirSync(remove, { recursive: true });
    // } catch (err) {
    //   return next(new ApiError("Error while deleting", 400));
    // }
    // res.status(200).json(image);
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
