const Message = require("../models/message");
const User = require("../models/user");
const ApiError = require("../utils/ApiError");
const WebSocket = require("../services/web-sockets");

function create(req, res, next) {
  const newMessage = new Message(req.body);
  console.log(newMessage);
  newMessage.save((err, message) => {
    if (err || !message) return next(new ApiError("Something went wrong", 400));
    // io.to(WebSocket.users[message.recipient]).emit("privateMessage", message);

    res.status(201).json(message);
  });
}
module.exports.create = create;

function get(req, res, next) {
  User.findById(req.userID).exec((err, user) => {
    if (err) return next(new ApiError("Something went wrong", 400));
    if (!user) return next(new ApiError("User not exist", 401));

    const followingUsers = user.getFollowingUsersIds((err, users) => {
      if (err) return next(new ApiError("Something went wrong", 400));
      return users;
    });
    const index = followingUsers.findIndex(
      (id) => id.toString() === req.params.id.toString()
    );

    if (index < 0) return next(new ApiError("User is not a friend", 404));

    const limit = parseInt(req.query.limit);
    const skip = parseInt(req.query.skip);

    Message.find({
      $or: [
        { $and: [{ sender: req.userID }, { recipient: req.params.id }] },
        { $and: [{ sender: req.params.id }, { recipient: req.userID }] },
      ],
    })

      .skip(skip)
      .limit(limit)
      .exec((err, messages) => {
        if (err) return next(new ApiError("Something went wrong", 400));
        if (!messages) return next(new ApiError("Messages not found", 404));
        res.status(200).json(messages);
      });
  });
}
module.exports.get = get;
