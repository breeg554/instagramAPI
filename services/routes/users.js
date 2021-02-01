const express = require("express");
const router = express.Router();
const users = require("../../controllers/users");
const messages = require("../../controllers/message");
const verify = require("../verify-token");

router.get("/", verify, users.getUserData);
router.get("/:name", verify, users.getUserByName);
router.get("/basic/:id", verify, users.getBasicDataById);
router.get("/accounts/search", verify, users.searchUsersByName);
router.get("/friends/posts", verify, users.getFollowedUsersPosts);
router.get("/followers/:id", verify, users.getFollowers);
router.get("/following/:id", verify, users.getFollowingUsers);
router.get("/messages/:id", verify, messages.get);
router.post("/register", users.register);
router.post("/login", users.login);
router.post("/follow", verify, users.toggleFollowUser);
router.post("/messages", verify, messages.create);

module.exports = router;
