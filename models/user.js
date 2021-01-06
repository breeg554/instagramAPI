const mongoose = require("mongoose");
const Image = require("./image");
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, required: true, unique: true }, // String is shorthand for {type: String}
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    date: { type: Date, default: Date.now },
    avatar: { type: String, default: null },
    followingUsers: [
      {
        user_id: Schema.Types.ObjectId,
      },
    ],
    followers: [
      {
        user_id: Schema.Types.ObjectId,
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.virtual("images", {
  ref: "Image",
  localField: "_id",
  foreignField: "creatorID",
});

userSchema.methods.getFeed = function (limit = 0, skip = 0, callback) {
  const followingUsersIDs = this.followingUsers.map(function (followingUser) {
    return followingUser._id;
  });
  // followingUsersIDs.push(this._id);

  return Image.find(
    { creatorID: { $in: followingUsersIDs } },
    function (err, posts) {
      callback(posts);
    }
  )
    .populate("author", "name avatar")
    .skip(skip)
    .limit(limit)
    .sort("-createdAt");
};

module.exports = mongoose.model("User", userSchema);
