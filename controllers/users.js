const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../config/db");
const User = require("../models/user");
const userUtils = require("../utils/user");
const ApiError = require("../utils/ApiError");

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
        if (!err.keyPattern) return next(err);
        else if (err.keyPattern.email)
          return next(new ApiError("This email is already used", 422));
        else if (err.keyPattern.name)
          return next(new ApiError("This name is already used", 422));
        else return next(new ApiError("Something went wrong", 400));
      }
      return res.status(201).json("Created succesful");
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
}
module.exports.register = register;

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).populate(
      userUtils.POPULATE_OPTIONS
    );
    if (!user) throw new ApiError("User not found", 404);

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new ApiError("Incorrect password", 400);
    const payload = {
      id: user._id,
      email: user.email,
    };

    const token = jwt.sign({ data: payload }, config.jwt, { expiresIn: "1h" });

    const resData = {
      user: userUtils.userDataToSend(user),
      token,
    };

    res.status(200).json(resData);
  } catch (err) {
    next(err);
    // res.status(400).json("Something went wrong");
  }
}
module.exports.login = login;

async function getData(req, res, next) {
  try {
    User.findById(req.userID)
      .populate(userUtils.POPULATE_OPTIONS)
      .exec((err, user) =>
        userUtils.handleUserResponse(req, res, next, err, user)
      );
  } catch (err) {
    next(err);
  }
}
module.exports.getUserData = getData;

async function getUserByName(req, res, next) {
  try {
    User.findOne({ name: req.params.name })
      .populate(userUtils.POPULATE_OPTIONS)
      .exec((err, user) =>
        userUtils.handleUserResponse(req, res, next, err, user)
      );
  } catch (err) {
    next(err);
  }
}
module.exports.getUserByName = getUserByName;

function follow(req, res, next) {
  User.findById(req.userID)
    .populate(userUtils.POPULATE_OPTIONS)
    .exec(async (err, user) => {
      if (err) return next(new ApiError("Something went wrong", 400));
      if (!user) return next(new ApiError("User not found", 404));

      try {
        const index = user.followingUsers.findIndex(
          (user) => user._id.toString() === req.body.userID.toString()
        );
        if (index > -1) {
          user.followingUsers.pull(req.body.userID);
          await User.findById(req.body.userID, function (err, follUser) {
            if (err) return next(new ApiError("Something went wrong", 400));
            if (!follUser) return next(new ApiError("User not found", 404));
            follUser.followers.pull(req.userID);
            follUser.save();
          });
        } else {
          user.followingUsers.push(req.body.userID);
          await User.findById(req.body.userID, function (err, follUser) {
            if (err) return next(new ApiError("Something went wrong", 400));
            if (!follUser) return next(new ApiError("User not found", 404));
            follUser.followers.push(req.userID);
            follUser.save();
          });
        }
        user.save();
        return res.status(200).json(userUtils.userDataToSend(user));
      } catch (err) {
        next(err);
      }
    });
}
module.exports.toggleFollowUser = follow;

function getPosts(req, res, next) {
  User.findById(req.userID).exec(async (err, user) => {
    if (err) return next(new ApiError("Something went wrong", 400));
    if (!user) return next(new ApiError("User not found", 404));

    try {
      const limit = parseInt(req.query.limit);
      const skip = parseInt(req.query.skip);

      let posts = await user.getFeed(limit, skip, function (err, posts) {
        return posts;
      });

      return res.status(200).json(posts);
    } catch (err) {
      next(err);
    }
  });
}
module.exports.getFollowedUsersPosts = getPosts;

function getFollowers(req, res, next) {
  User.findById(req.params.id).exec(async (err, user) => {
    if (err) return next(new ApiError("Something went wrong", 400));
    if (!user) return next(new ApiError("User not found", 404));
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
        if (err) return next(new ApiError("Something went wrong", 400));
        if (!followers) return next(new ApiError("Users not found", 404));
        return res.status(200).json(followers);
      });
  });
}
module.exports.getFollowers = getFollowers;
function getFollowingUsers(req, res, next) {
  User.findById(req.params.id).exec(async (err, user) => {
    if (err) return next(new ApiError("Something went wrong", 400));
    if (!user) return next(new ApiError("User not found", 404));
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
        if (err) return next(new ApiError("Something went wrong", 400));
        if (!followingUsers) return next(new ApiError("Users not found", 404));
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
      if (err) return next(new ApiError("Something went wrong", 400));
      return res.status(200).json(users);
    });
}
module.exports.searchUsersByName = searchUsersByName;
async function updateAvatar(req, res, next) {
  // const user = await User.findById(req.userID).exec(async (err, user) => {
  //   if (err) return next(new ApiError("Something went wrong", 400));
  //   if (!user) return next(new ApiError("User not found", 404));
  //   return user;
  // });
  // if (user.avatar) {
  //   await Image.findById(user.avatar).exec((err, image) => {
  //     if (err) return next(new ApiError("Something went wrong", 400));
  //     if (!image) return next(new ApiError("Image doesnt exists", 404));
  //     if (req.userID.toString() !== image.creatorID.toString())
  //       return next(new ApiError("Access denied", 401));
  //     Image.deleteOne({ _id: image._id }, (err, image) => {
  //       if (err) return next(new ApiError("Something went wrong", 400));
  //       return;
  //     });
  //     const lastIndex = image.path.lastIndexOf("\\");
  //     const remove = path.join(
  //       __dirname,
  //       "..",
  //       "uploads",
  //       `${image.path.substring(0, lastIndex)}`
  //     );
  //     try {
  //       fs.rmdirSync(remove, { recursive: true });
  //     } catch (err) {
  //       return next(new ApiError("Error while deleting", 400));
  //     }
  //   });
  // }
  // const remove = path.join(__dirname, "..", "uploads");
  // const relPath = req.file.path.replace(remove, "");
  // const newImage = new Image(req.body);
  // newImage.creatorID = req.userID;
  // newImage.path = relPath;
  // newImage.isAvatar = true;
  // newImage.save((err, image) => {
  //   if (err) return next(new ApiError("Something went wrong", 400));
  //   user.avatar = image._id;
  //   user.save();
  //   res.status(200).json(user);
  // });
}
module.exports.updateAvatar = updateAvatar;
