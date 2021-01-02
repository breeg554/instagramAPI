const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const Image = require("../../models/image");
const verify = require("../verify-token");
const controller = require("../../controllers/images");

const storage = multer.diskStorage({
  destination: function (req, res, cb) {
    const uploadsDir = path.join(
      __dirname,
      "..",
      "..",
      "uploads",
      `${Date.now()}`
    );

    fs.mkdirSync(uploadsDir);
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });
router.post("/", verify, upload.single("file"), controller.uploadImage);
router.get("/", verify, controller.getImages);
router.get("/:id", verify, controller.getImageById);
router.delete("/:id", verify, controller.deleteImage);
module.exports = router;
