const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../config/db");
const User = require("../models/user");

const POPULATE_OPTIONS = {
  path: "images",
  model: "Image",
  options: { sort: { createdAt: -1 } },
  populate: {
    path: "author",
    model: "User",
    select: "name avatar",
  },
};

function userDataToSend(user) {
  const { password, date, __v, ...rest } = user._doc;
  return (resUser = { ...rest, id: user._doc._id, images: user.images });
}

function handleUserResponse(req, res, err, user) {
  if (err) return res.status(400).json("Something went wrong");
  if (!user) return res.status(404).json("User not found");

  return res.status(200).json(userDataToSend(user));
}

async function register(req, res, next) {
  try {
    const { name, email, avatar, password } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashPassword,
      avatar,
    });
    newUser.save((err) => {
      if (err) {
        if (err.keyPattern.email)
          return res.status(422).json("This email is already used");
        else if (err.keyPattern.name)
          return res.status(422).json("This name is already used");
        else return res.status(400).json("Something went wrong");
      }
      return res.status(201).json("Created succesful");
    });
  } catch (err) {
    console.log(err);
    res.status(400).json("Something went wrong");
  }
}
module.exports.register = register;

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).populate(POPULATE_OPTIONS);
    if (!user) return res.status(404).json("User not found");

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json("Incorrect email or password");
    const payload = {
      id: user._id,
      email: user.email,
    };

    const token = jwt.sign({ data: payload }, config.jwt, { expiresIn: "1h" });

    const resData = {
      user: userDataToSend(user),
      token,
    };

    res.status(200).json(resData);
  } catch (err) {
    console.log(err);
    res.status(400).json("Something went wrong");
  }
}
module.exports.login = login;

async function getData(req, res, next) {
  try {
    User.findById(req.userID)
      .populate(POPULATE_OPTIONS)
      .exec((err, user) => handleUserResponse(req, res, err, user));
  } catch (err) {
    console.log(err);
    res.status(400).json("Something went wrong");
  }
}
module.exports.getUserData = getData;

async function getUserByName(req, res, next) {
  try {
    User.findOne({ name: req.params.name })
      .populate(POPULATE_OPTIONS)
      .exec((err, user) => handleUserResponse(req, res, err, user));
  } catch (err) {
    console.log(err);
    res.status(400).json("Something went wrong");
  }
}
module.exports.getUserByName = getUserByName;

function follow(req, res, next) {
  User.findById(req.userID)
    .populate(POPULATE_OPTIONS)
    .exec(async (err, user) => {
      if (err) return res.status(400).json("Something went wrong");
      if (user === null) return res.status(404).json("User not found");

      const index = user.followingUsers.findIndex(
        (user) => user._id.toString() === req.body.userID.toString()
      );
      if (index > -1) {
        user.followingUsers.pull(req.body.userID);
        await User.findById(req.body.userID, function (err, follUser) {
          if (err) return res.status(400).json("Something went wrong");
          if (follUser === null) return res.status(404).json("User not found");
          follUser.followers.pull(req.userID);
          follUser.save();
        });
      } else {
        user.followingUsers.push(req.body.userID);
        await User.findById(req.body.userID, function (err, follUser) {
          if (err) return res.status(400).json("Something went wrong");
          if (follUser === null) return res.status(404).json("User not found");
          follUser.followers.push(req.userID);
          follUser.save();
        });
      }

      user.save();
      return res.status(200).send(userDataToSend(user));
    });
}
module.exports.toggleFollowUser = follow;

function getPosts(req, res, next) {
  User.findById(req.userID).exec(async (err, user) => {
    if (err) return res.status(400).json("Something went wrong");
    if (!user) return res.status(401).json("User not found");

    try {
      const limit = parseInt(req.query.limit);
      const skip = parseInt(req.query.skip);

      let posts = await user.getFeed(limit, skip, function (err, posts) {
        return posts;
      });

      return res.status(200).json(posts);
    } catch (err) {
      return res.status(400).json("Something went wrong");
    }
  });
}
module.exports.getFollowedUsersPosts = getPosts;

function getFollowers(req, res, next) {
  User.findById(req.params.id).exec(async (err, user) => {
    if (err) return res.status(400).json("Something went wrong");
    if (!user) return res.status(404).json("User not found");
    const limit = parseInt(req.query.limit);
    const skip = parseInt(req.query.skip);

    const followersIds = user.getFollowersIds((err, users) => {
      return users;
    });

    User.find({ _id: { $in: followersIds } })
      .skip(skip)
      .limit(limit)
      .sort("name")
      .select("name avatar")
      .exec((err, followers) => {
        if (err) return res.status(400).json("Something went wrong");
        if (!followers) return res.status(404).json("Users not found");
        return res.status(200).json(followers);
      });
  });
}
module.exports.getFollowers = getFollowers;
function getFollowingUsers(req, res, next) {
  User.findById(req.params.id).exec(async (err, user) => {
    if (err) return res.status(400).json("Something went wrong");
    if (!user) return res.status(404).json("User not found");
    const limit = parseInt(req.query.limit);
    const skip = parseInt(req.query.skip);

    const followingUsersIds = user.getFollowingUsersIds((err, users) => {
      return users;
    });

    User.find({ _id: { $in: followingUsersIds } })
      .skip(skip)
      .limit(limit)
      .sort("name")
      .select("name avatar")
      .exec((err, followingUsers) => {
        if (err) return res.status(400).json("Something went wrong");
        if (!followingUsers) return res.status(404).json("Users not found");
        return res.status(200).json(followingUsers);
      });
  });
}
module.exports.getFollowingUsers = getFollowingUsers;
function searchUsersByName(req, res, next) {
  const limit = parseInt(req.query.limit);
  const regex = new RegExp(req.query.term, "i");

  User.find({ name: regex, _id: { $ne: req.userID } }, "name avatar")
    .sort({ name: -1 })
    .limit(limit)
    .exec((err, users) => {
      if (err) return res.status(400).json("Something went wrong");
      return res.status(200).json(users);
    });
}
module.exports.searchUsersByName = searchUsersByName;
