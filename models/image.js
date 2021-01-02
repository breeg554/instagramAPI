const mongoose = require("mongoose");
const { Schema } = mongoose;

const imageSchema = new Schema({
  description: { type: String, default: "" },
  path: { type: String, required: true },
  creatorID: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Image", imageSchema);
