const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../config/db");
const User = require("../models/user");

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashPassword,
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
    const user = await User.findOne({ email }).populate("images");
    if (!user) return res.status(404).json("User not found");

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json("Incorrect email or password");
    const payload = {
      id: user._id,
      email: user.email,
    };

    const token = jwt.sign({ data: payload }, config.jwt, { expiresIn: "1h" });

    const resData = {
      id: user._id,
      name: user.name,
      email,
      images: user.images,
      followingUsers: user.followingUsers,
      token,
    };

    res.status(200).json(resData);
  } catch (err) {
    console.log(err);
    res.status(400).json("Something went wrong");
  }
}
module.exports.login = login;

function follow(req, res, next) {
  User.findById(req.userID, (err, user) => {
    if (err) return res.status(400).json("Something went wrong");
    if (user === null) return res.status(404).json("User not found");

    User.exists(
      { _id: req.userID, "followingUsers._id": req.body.userID },
      (err, isExist) => {
        if (err) return res.status(400).json("Something went wrong");

        if (!isExist) {
          user.followingUsers.push(req.body.userID);
        } else {
          user.followingUsers.pull(req.body.userID);
        }
        user.save();
        return res.status(204).send();
      }
    );
  });
}
module.exports.toggleFollowUser = follow;

function getPosts(req, res, next) {
  User.findById(req.userID).exec(async function (err, user) {
    if (err) return res.status(400).json("Something went wrong");

    if (!user) return res.status(404).json("User not found");

    try {
      const posts = await user.getFeed(function (err, posts) {
        return posts;
      });
      return res.status(200).json(posts);
    } catch (err) {
      return res.status(400).json("Something went wrong");
    }
  });
}
module.exports.getFollowedUsersPosts = getPosts;
