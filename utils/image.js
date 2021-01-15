const Image = require("../models/image");

async function deleteImageById(req, res, next, id) {
  return await Image.findById(id, async (err, image) => {
    if (err) return next(new ApiError("Something went wrong", 400));
    if (!image) return next(new ApiError("Image doesnt exists", 404));

    if (req.userID.toString() !== image.creatorID.toString())
      return next(new ApiError("Access denied", 401));

    await Image.deleteOne({ _id: image._id }, function (err, image) {
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
    return image;
  });
}
module.exports.deleteImageById = deleteImageById;
