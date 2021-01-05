const express = require("express");
const router = express.Router();
const users = require("../../controllers/users");
const verify = require("../verify-token");

router.get("/", verify, users.getUserData);
router.get("/:name", verify, users.getUserByName);
router.post("/register", users.register);
router.post("/login", users.login);
router.post("/follow", verify, users.toggleFollowUser);
router.get("/friends/posts", verify, users.getFollowedUsersPosts);
module.exports = router;
