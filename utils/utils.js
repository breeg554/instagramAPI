function userDataToSend(user) {
  const { password, date, __v, ...rest } = user._doc;
  return (resUser = { ...rest, id: user._doc._id, images: user.images });
}
module.exports.userDataToSend = userDataToSend;
function handleUserResponse(req, res, err, user) {
  if (err) return res.status(400).json("Something went wrong");
  if (!user) return res.status(404).json("User not found");

  return res.status(200).json(userDataToSend(user));
}
module.exports.handleUserResponse = handleUserResponse;
