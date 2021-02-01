const mongoose = require("mongoose");
const { Schema } = mongoose;

const imageSchema = new Schema(
  {
    description: { type: String, default: "" },
    path: { type: String, required: true },
    creatorID: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    publicID: { type: String, required: true },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    likes: [
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
imageSchema.virtual("author", {
  ref: "User",
  localField: "creatorID",
  foreignField: "_id",
  justOne: true,
});
module.exports = mongoose.model("Image", imageSchema);
