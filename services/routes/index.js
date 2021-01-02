const express = require("express");
const router = express.Router();
const users = require("./users");
const images = require("./images");

router.use("/user", users);
router.use("/images", images);
module.exports = router;
