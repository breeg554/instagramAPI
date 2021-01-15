const mongoose = require("mongoose");
const { Schema } = mongoose;

const messageSchema = new Schema({
  name: { type: String, required: true },
  sender: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  recipient: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Message", messageSchema);
