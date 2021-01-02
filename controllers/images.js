const path = require("path");
const Image = require("../models/image");
const fs = require("fs");

async function get(req, res) {
  await Image.find({ creatorID: req.userID }, function (err, image) {
    if (err) res.status(400).json("Something went wrong");
    res.status(200).json(image);
  });
}
module.exports.getImages = get;

async function getById(req, res) {
  await Image.findById(req.params.id, function (err, image) {
    if (err) res.status(400).json("Something went wrong");
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
  newImage.save(function (err, image) {
    if (err) res.status(400).json("Something went wrong");
    res.status(201).json(image);
  });
}
module.exports.uploadImage = create;

function destroy(req, res) {
  Image.findById(req.params.id, function (err, image) {
    if (err) return res.status(400).json("Something went wrong");

    if (image === null) return res.status(404).json("Image doesnt exists");

    if (req.userID.toString() !== image.creatorID.toString())
      return res.status(401).json("Access denied");

    Image.deleteOne({ _id: image._id }, function (err, image) {
      if (err) res.status(400).json("Something went wrong");
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
      console.error(`Error while deleting ${remove}.`);
    }
    res.status(200).json(image);
  });
}
module.exports.deleteImage = destroy;
