const ApiError = require("../utils/ApiError");

module.exports.POPULATE_OPTIONS = {
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
module.exports.userDataToSend = userDataToSend;

module.exports.handleUserResponse = function (req, res, next, err, user) {
  if (err) return next(new ApiError("Something went wrong", 400));
  if (!user) return next(new ApiError("User not found", 404));

  return res.status(200).json(userDataToSend(user));
};
