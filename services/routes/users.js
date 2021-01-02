const express = require("express");
const router = express.Router();
const users = require("../../controllers/users");
const verify = require("../verify-token");

router.post("/register", users.register);
router.post("/login", users.login);
router.get("/friends/posts", verify, users.getFollowedUsersPosts);
router.put("/follow", verify, users.toggleFollowUser);
module.exports = router;
